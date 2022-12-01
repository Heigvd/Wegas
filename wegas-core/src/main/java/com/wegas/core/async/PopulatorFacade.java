/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.async;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.cp.lock.FencedLock;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.core.security.util.ScriptExecutionContext;
import com.wegas.core.security.util.Sudoer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.Resource;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionManagement;
import javax.ejb.TransactionManagementType;
import javax.inject.Inject;
import javax.transaction.NotSupportedException;
import javax.transaction.SystemException;
import javax.transaction.UserTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence
 */
@Stateless
@LocalBean
@TransactionManagement(TransactionManagementType.BEAN)
public class PopulatorFacade extends WegasAbstractFacade {

    private static final Logger logger = LoggerFactory.getLogger(PopulatorFacade.class);

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

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

    static private Boolean forceQuit = false;

    /**
     * Two-step team creation: second step
     *
     * @param teamId
     * @param accountId
     */
    public void populateTeam(Long teamId, Long accountId) {
        requestManager.su(accountId);
        Team team = teamFacade.find(teamId);
        teamFacade.detach(team);
        try {
            utx.begin();
            team = teamFacade.find(teamId);
            requestManager.setCurrentTeam(team);
            try (ScriptExecutionContext ctx = requestManager.switchToInternalExecContext(true)) {
                Game game = gameFacade.find(team.getGameId());
                gameModelFacade.createAndRevivePrivateInstance(game.getGameModel(), team);

                team.setStatus(Status.LIVE);

            }
            utx.commit();
        } catch (Exception ex) {
            logger.error("Populate Team: Failure", ex);
            if (utx != null) {
                try {
                    utx.rollback();
                } catch (Exception ex1) {
                    logger.error("Populate Team: Fails to rollback");
                }
                try {
                    utx.begin();
                    team = teamFacade.find(teamId);
                    this.postpone(team);
                    utx.commit();
                } catch (Exception ex1) {
                    logger.error("Fails to revert Team status");
                }
            }
        } finally {
            requestManager.releaseSu();
        }
    }

    public void populatePlayer(Long playerId, Long accountId) {
        requestManager.su(accountId);
        Player player = playerFacade.find(playerId);
        playerFacade.detach(player);

        try {
            utx.begin();
            player = playerFacade.find(playerId);
            try (ActAsPlayer acting = requestManager.actAsPlayer(player)) {
                acting.setFlushOnExit(false); // user managed TX

                try (ScriptExecutionContext ctx = requestManager.switchToInternalExecContext(true)) {
                    // Inform player's user its player is processing
                    websocketFacade.propagateNewPlayer(player);
                    Team team = teamFacade.find(player.getTeamId());

                    gameModelFacade.createAndRevivePrivateInstance(team.getGame().getGameModel(), player);

                    player.setStatus(Status.INITIALIZING);
                    this.flush();

                    // When joining a game, force all state machine
                    // this is required because transitions which depend on default value
                    // will not been triggered otherwise
                    stateMachineFacade.runStateMachines(player, true);

                    player.setStatus(Status.LIVE);
                }

                utx.commit();
                websocketFacade.propagateNewPlayer(player);
            }

        } catch (Exception ex) {
            logger.error("Populate Player: Failure", ex);
            if (utx != null) {
                try {
                    utx.rollback();
                } catch (Exception ex1) {
                    logger.error("Populate Player: Fails to rollback");
                }

                try {
                    utx.begin();
                    player = playerFacade.find(playerId);
                    this.postpone(player);
                    utx.commit();
                    // Inform Lobby about failure
                    websocketFacade.propagateNewPlayer(player);
                } catch (Exception ex1) {
                    logger.error("Fails to revert Team status");
                }
            }
        } finally {
            requestManager.releaseSu();
        }
    }

    public FencedLock getLock() {
        return hzInstance.getCPSubsystem().getLock("PopulatorSchedulerLock");
    }

    /**
     * Something went wring during the populate process If it was the first attempt, another
     * tentative will be scheduled. The target will be makes as failed whether it was the second
     * attempt.
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
     * Set the target status to processing. For the first shop : processing, for the second
     * tentative sec_processing
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

    /**
     * Return the position of the player in the player-to-populate queue
     *
     * @param player
     *
     * @return the position of the player or -1 if the player is not queued
     */
    public int getPositionInQueue(Player player) {
        try {
            utx.begin();
            try (Sudoer root = requestManager.sudoer()) {
                return this.getQueue().indexOf(player);
            } finally {
                utx.rollback();
            }
        } catch (NotSupportedException | SystemException ex) {
            return -1;
        }
    }

    public List<DatedEntity> getQueue() {
        List<DatedEntity> queue = new ArrayList<>();
        queue.addAll(teamFacade.findTeamsToPopulate());
        queue.addAll(playerFacade.findPlayersToPopulate());
        Collections.sort(queue, new EntityComparators.CreateTimeComparator());
        return queue;
    }

    public int getQueueSize() {
        return this.getQueue().size();
    }

    public static void setForceQuit(boolean forceQuit) {
        PopulatorFacade.forceQuit = forceQuit;
    }

    public Candidate getNextCandidate(Populator currentCreator) {
        requestManager.su();
        Candidate candidate = null;

        FencedLock lock = this.getLock();
        lock.lock();
        try {
            try {
                utx.begin();

                if (forceQuit) {
                    logger.info("Force Populator to quit");
                    candidate = null;
                } else {

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
                            candidate = new Candidate(t.getCreatedBy().getMainAccount().getId(), t);
                            break;
                        } else if (pop instanceof Player
                            && teamFacade.find(((Player) pop).getTeam().getId()).getStatus().equals(Status.LIVE)) {
                            Player p = (Player) pop;
                            this.markAsProcessing(p);
                            candidate = new Candidate(p.getUser().getMainAccount().getId(), p);
                            break;
                        }
                    }
                }

                // No new job for callee...
                if (candidate == null) {
                    populatorScheduler.removePopulator(currentCreator);
                    utx.rollback();
                } else {
                    websocketFacade.populateQueueDec();
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
            requestManager.releaseSu();
        }
        return candidate;
    }

    public PopulatorScheduler getPopulatorScheduler() {
        return populatorScheduler;
    }

    public static class Candidate {

        public InstanceOwner owner;
        public Long accountId;

        public Candidate(Long accountId, InstanceOwner owner) {
            this.owner = owner;
            this.accountId = accountId;
        }
    }
}
