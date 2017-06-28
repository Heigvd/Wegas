/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.async;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import com.wegas.core.ejb.*;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Future;
import javax.annotation.Resource;
import javax.ejb.LocalBean;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.enterprise.inject.Instance;

import javax.inject.Inject;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Named
@LocalBean
public class PopulatorScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PopulatorScheduler.class);

    private static final int MAX_CREATORS;

    protected static final String EVENT_NAME = "Wegas_StartPopulator";

    static {
        MAX_CREATORS = Integer.parseInt(Helper.getWegasProperty("CONCURRENT_CREATORS", "1"));
    }

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    @Inject
    @Outbound(eventName = EVENT_NAME, loopBack = true)
    Event<String> events;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private HazelcastInstance hzInstance;

    @Resource
    private ManagedExecutorService managedExecutorService;

    @Inject
    private Instance<Populator> myCreators;

    private static List<Populator> creators = new ArrayList<>();

    public void scheduleCreation() {
        logger.error("SEND EVENT");
        events.fire("START");
    }

    public void onScheduleCreation(@Observes @Inbound(eventName = EVENT_NAME) String event) {
        logger.error("EVENT RECEIVED: " + event);
        this.internalScheduleCreation();
    }

    protected Future<Integer> internalScheduleCreation() {
        Future<Integer> future = null;
        // allowed to create more creators ?
        if (creators.size() < MAX_CREATORS) {
            Populator newCreator = myCreators.get();
            creators.add(newCreator);
            future = managedExecutorService.submit(newCreator);
        }
        return future;
    }

    private ILock getLock() {
        return hzInstance.getLock("PopulatorSchedulerLock");
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public AbstractEntity getNextOwner(Populator currentCreator) {
        AbstractEntity owner = null;

        ILock lock = this.getLock();
        lock.lock();
        try {
            logger.error(currentCreator + " requests some work");

            List<DatedEntity> queue = new ArrayList<>();
            queue.addAll(teamFacade.findNotLive());
            queue.addAll(playerFacade.findNotLive());

            // sort by creationTime
            Collections.sort(queue, new EntityComparators.CreateTimeComparator());

            logger.error("Candidates: ");
            for (DatedEntity de : queue) {
                AbstractEntity ae = (AbstractEntity) de;
                logger.error(" - " + ae + " (" + ae.getId() + ")");
            }

            // return oldest but skip player | player.team.status != 'LIVE'
            for (DatedEntity pop : queue) {
                if (pop instanceof Team) {
                    Team t = (Team) pop;
                    //t = teamFacade.find(t.getId());
                    t.setStatus(Team.Status.PROCESSING);
                    teamFacade.merge(t);
                    logger.error("set status to PROCESSING");
                    owner = t;
                    break;
                } else if (pop instanceof Player
                        && teamFacade.find(((Player) pop).getTeam().getId()).getStatus().equals(Team.Status.LIVE)) {
                    Player p = (Player) pop;
                    p = em.find(Player.class, p.getId());
                    p.setStatus(Player.Status.PROCESSING);
                    logger.error("set status to PROCESSING");
                    owner = p;
                    break;
                }
            }

            // No new job for callee...
            if (owner == null) {
                creators.remove(currentCreator);
            } else {
                logger.error("Owner to create instances for: " + owner + " (" + owner.getId() + ")");
            }
        } finally {
            lock.unlock();
        }
        return owner;
    }
}
