/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.exception.WegasException;
import com.wegas.leaderway.persistence.DialogueTransition;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.script.ScriptException;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@LocalBean
public class StateMachineRunner implements Serializable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(StateMachineRunner.class);
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    @EJB
    private ScriptFacade scriptManager;
    /**
     * StateMachineRunner is running
     */
    private Boolean run = false;
    /**
     * Used to store each transition triggered by a specific player
     */
    @Inject
    private RequestManager requestManager;

    public StateMachineRunner() {
    }

    public void entityUpdateListener(@Observes RequestManager.PlayerAction playerAction) throws WegasException {
        this.playerUpdated(playerAction.getPlayer());
    }

    public void playerUpdated(Player player) {

        Integer steps = 0;
        logger.debug("Updated instances {}, transition done : {}", requestManager.getUpdatedInstances());
        if (run) {
            logger.info("Running, received changed {}", requestManager.getUpdatedInstances());
            return;
        }

        run = true;
        //gameManager.clearUpdatedInstances();
        //TODO: lock SMInstance (concurrency)

        /* Find players for each instance */
        List<Player> players = new ArrayList<>();
        if (player != null) {
            players.add(player);
        } else {
            for (VariableInstance instance : requestManager.getUpdatedInstances()) {
                try {
                players.add(variableInstanceFacade.findAPlayer(instance));
                } catch (ArrayIndexOutOfBoundsException e) {
                    // GOTCHA (This instance has no players, the team is empty
                }
            }
        }
        if (players.size() < 1) {
            logger.warn("No players found");
            return;
        }
        /* build a list with each statemachine instance relevant to players (MAP) */
        Map<StateMachineInstance, Player> statemachinesPlayerMap = new HashMap<>();
        GameModel gamemodel = players.get(0).getGameModel();
        List<VariableDescriptor> stateMachineDescriptors = variableDescriptorFacade.findByClass(gamemodel, StateMachineDescriptor.class);
        for (VariableDescriptor stateMachineDescriptor : stateMachineDescriptors) {
            for (Player p : players) {
                statemachinesPlayerMap.put((StateMachineInstance) stateMachineDescriptor.getInstance(p), p);
            }
        }

        Map<Player, HashSet<Transition>> playerTransitions = new HashMap<>();
        logger.debug("StateMachineInstance(s) found: {}", statemachinesPlayerMap);
        while (this.run(statemachinesPlayerMap, playerTransitions)) {
            steps += 1;
        }
        run = false;
        if (steps > 0) {
            for (Player p : playerTransitions.keySet()) {
                logger.info("#steps[" + steps + "] - Player {} triggered transition(s):{}", p.getName(), playerTransitions.get(p));
            }
        }
    }

    private Boolean run(Map<StateMachineInstance, Player> statemachinesPlayerMap, Map<Player, HashSet<Transition>> playerTransitions) {

        Boolean transitionTriggered = false;
        Map<Player, List<Script>> playerImpacts = new HashMap<>();
        Player currentPlayer;
        List<Script> impacts;
        HashSet<Transition> passedTransitions;

        for (StateMachineInstance stateMachine : statemachinesPlayerMap.keySet()) {
            /* Skip disabled Statemachines */
            if (!stateMachine.getEnabled()) {
                continue;
            }
            currentPlayer = statemachinesPlayerMap.get(stateMachine);

            /* Setup player's passed transitions */
            if (playerTransitions.get(currentPlayer) == null) {
                passedTransitions = new HashSet<>();
                playerTransitions.put(currentPlayer, passedTransitions);
            } else {
                passedTransitions = playerTransitions.get(currentPlayer);
            }

            /* Setup player's impact list */
            if (playerImpacts.get(currentPlayer) == null) {
                impacts = new ArrayList<>();
                playerImpacts.put(currentPlayer, impacts);
            } else {
                impacts = playerImpacts.get(currentPlayer);
            }
            List<Transition> transitions = stateMachine.getCurrentState().getTransitions();
            /* Loop on each state's transtions until a valid transition is found */
            for (Transition transition : transitions) {
                Boolean validTransition = false;
                try {
                    if (!(transition instanceof DialogueTransition)
                            && transition.getTriggerCondition() != null) {      //Do not eval Dialogue transition, no condition means invalid transition
                        requestManager.setPlayer(currentPlayer);
                        validTransition = (Boolean) scriptManager.eval(transition.getTriggerCondition());
                    }
                } catch (ScriptException ex) {
                    logger.error("Script Failed : {} returned: {}", transition.getTriggerCondition(), ex);
                }

                if (validTransition == null) {
                    throw new WegasException("Please review condition [" + stateMachine.getDescriptor().getName() + "]:\n"
                            + transition.getTriggerCondition().getContent());
                } else if (validTransition) {
                    /* A valid transition has been found */
                    if (passedTransitions.contains(transition)) {
                        /* Loop prevention : that player already passed through this transiton */
                        logger.info("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        passedTransitions.add(transition);                      //Store transition to avoid doing it again
                        stateMachine.setCurrentStateId(transition.getNextStateId());//Change statemachine's state
                        impacts.add(transition.getPreStateImpact());            //Prepare for eval
                        impacts.add(stateMachine.getCurrentState().getOnEnterEvent()); //Prepare for eval
                        stateMachine.transitionHistoryAdd(transition.getId());  // Adding transition.id to history
                        transitionTriggered = true;
                        break;
                    }
                }
            }
        }
        this.compute(playerImpacts);
        return transitionTriggered;
    }

    /**
     * Compute for a list of players their impact list
     *
     * @param playerImpacts Map a player with a list of corresponding Script
     * impacts
     */
    private void compute(Map<Player, List<Script>> playerImpacts) {
        for (Iterator<Player> it = playerImpacts.keySet().iterator(); it.hasNext();) {
            Player p = it.next();
            requestManager.setPlayer(p);
            if (playerImpacts.get(p).size() > 0) {
                logger.debug("Compute for {}\n{}", p.getName(), playerImpacts.get(p));
                try {
                    scriptManager.eval(playerImpacts.get(p));
                } catch (ScriptException | WegasException ex) {
                    logger.warn("Script failed {}", ex);
                }
            }
        }
    }
}
