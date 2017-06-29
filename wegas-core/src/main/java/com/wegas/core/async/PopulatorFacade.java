/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.async;

import com.wegas.core.ejb.*;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.Resource;
import javax.ejb.TransactionManagement;
import javax.ejb.TransactionManagementType;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.transaction.UserTransaction;

/**
 * @author Maxence
 */
@Stateless
@LocalBean
@TransactionManagement(TransactionManagementType.BEAN)
public class PopulatorFacade {

    private static final Logger logger = LoggerFactory.getLogger(PopulatorFacade.class);

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private PopulatorScheduler populatorScheduler;

    /**
     *
     */
    @Inject
    private GameFacade gameFacade;

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private GameModelFacade gameModelFacade;

    @Resource
    private UserTransaction utx;

    /**
     * Two-step team creation: second step
     *
     * @param teamId
     */
    public void populateTeam(Long teamId) {
        try {
            utx.begin();
            Team team = teamFacade.find(teamId);
            Game game = gameFacade.find(team.getGameId());
            gameModelFacade.createAndRevivePrivateInstance(game.getGameModel(), team);

            team.setStatus(Team.Status.LIVE);

            utx.commit();
        } catch (Exception ex) {
            logger.error("Populate Team: Failure");
            if (utx != null) {
                try {
                    utx.rollback();
                } catch (Exception ex1) {
                    logger.error("Populate Team: Fails to rollback");
                }
            }
        }
    }

    public void populatePlayer(Long playerId) {
        try {
            utx.begin();
            Player player = playerFacade.find(playerId);
            Team team = teamFacade.find(player.getTeamId());

            gameModelFacade.createAndRevivePrivateInstance(team.getGame().getGameModel(), player);

            player.setStatus(Player.Status.LIVE);

            this.em.flush();
            gameModelFacade.runStateMachines(player);
            utx.commit();
        } catch (Exception ex) {
            logger.error("Populate Player: Failure");
            if (utx != null) {
                try {
                    utx.rollback();
                } catch (Exception ex1) {
                    logger.error("Populate Player: Fails to rollback");
                }
            }
        }
    }

    private ILock getLock() {
        return hzInstance.getLock("PopulatorSchedulerLock");
    }

    public AbstractEntity getNextOwner(Populator currentCreator) {
        AbstractEntity owner = null;

        ILock lock = this.getLock();
        lock.lock();
        try {
            try {
                utx.begin();
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
                        logger.error("set status to PROCESSING");
                        owner = t;
                        break;
                    } else if (pop instanceof Player
                            && teamFacade.find(((Player) pop).getTeam().getId()).getStatus().equals(Team.Status.LIVE)) {
                        Player p = (Player) pop;
                        //p = em.find(Player.class, p.getId());
                        p.setStatus(Player.Status.PROCESSING);
                        logger.error("set status to PROCESSING");
                        owner = p;
                        break;
                    }
                }

                // No new job for callee...
                if (owner == null) {
                    populatorScheduler.removePopulator(currentCreator);
                    utx.rollback();
                } else {
                    utx.commit();
                    logger.error("Owner to create instances for: " + owner + " (" + owner.getId() + ")");
                }
            } catch (Exception ex) {
                logger.error("Find Next: Failure");
                if (utx != null) {
                    try {
                        utx.rollback();
                    } catch (Exception ex1) {
                        logger.error("FindNext: Fails to rollback");
                    }
                }
            }
        } finally {
            lock.unlock();
        }
        return owner;
    }
}
