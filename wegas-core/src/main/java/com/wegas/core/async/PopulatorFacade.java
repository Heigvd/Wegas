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
import com.wegas.core.persistence.game.Populatable;
import com.wegas.core.persistence.game.Populatable.Status;
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

    @Inject
    private WebsocketFacade websocketFacade;

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

            team.setStatus(Status.LIVE);

            utx.commit();
        } catch (Exception ex) {
            logger.error("Populate Team: Failure");
            if (utx != null) {
                try {
                    utx.rollback();
                } catch (Exception ex1) {
                    logger.error("Populate Team: Fails to rollback");
                }
                try {
                    utx.begin();
                    Team team = teamFacade.find(teamId);
                    this.postpone(team);
                    utx.commit();
                } catch (Exception ex1) {
                    logger.error("Fails to revert Team status");
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

            player.setStatus(Status.LIVE);

            this.em.flush();
            gameModelFacade.runStateMachines(player);
            utx.commit();
            websocketFacade.propagateNewPlayer(player);

        } catch (Exception ex) {
            logger.error("Populate Player: Failure");
            if (utx != null) {
                try {
                    utx.rollback();
                } catch (Exception ex1) {
                    logger.error("Populate Player: Fails to rollback");
                }

                try {
                    utx.begin();
                    Player player = playerFacade.find(playerId);
                    this.postpone(player);
                    utx.commit();
                } catch (Exception ex1) {
                    logger.error("Fails to revert Team status");
                }
            }
        }
    }

    private ILock getLock() {
        return hzInstance.getLock("PopulatorSchedulerLock");
    }

    /**
     * Something went wring during the populate process
     * If it was the first attempt, another tentative will be scheduled.
     * The target will be makes as failed whether it was the second attempt.
     *
     * @param p
     */
    private void postpone(Populatable p) {
        if (p.getStatus().equals(Status.SEC_PROCESSING)) {
            p.setStatus(Status.FAILED);
        } else {
            p.setStatus(Status.RESCHEDULED);
        }
    }

    /**
     * Set the target status to processing.
     * For the first shop : processing, for the second tentative sec_processing
     *
     * @param p
     */
    private void markAsProcessing(Populatable p) {
        if (p.getStatus().equals(Status.RESCHEDULED)) {
            p.setStatus(Status.SEC_PROCESSING);
        } else {
            p.setStatus(Status.PROCESSING);
        }
    }

    public AbstractEntity getNextOwner(Populator currentCreator) {
        AbstractEntity owner = null;

        ILock lock = this.getLock();
        lock.lock();
        try {
            try {
                utx.begin();

                List<DatedEntity> queue = new ArrayList<>();
                queue.addAll(teamFacade.findTeamsToPopulate());
                queue.addAll(playerFacade.findPlayersToPopulate());

                // sort by creationTime
                Collections.sort(queue, new EntityComparators.CreateTimeComparator());

                // return oldest but skip player | player.team.status != 'LIVE'
                for (DatedEntity pop : queue) {
                    if (pop instanceof Team) {
                        Team t = (Team) pop;
                        this.markAsProcessing(t);
                        owner = t;
                        break;
                    } else if (pop instanceof Player
                            && teamFacade.find(((Player) pop).getTeam().getId()).getStatus().equals(Status.LIVE)) {
                        Player p = (Player) pop;
                        this.markAsProcessing(p);
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
