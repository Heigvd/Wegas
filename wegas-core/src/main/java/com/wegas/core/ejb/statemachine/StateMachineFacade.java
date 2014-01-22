/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.PlayerAction;
import com.wegas.core.event.ResetEvent;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.resourceManagement.persistence.DialogueTransition;
import java.io.Serializable;
import java.util.*;
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
public class StateMachineFacade implements Serializable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(StateMachineFacade.class);
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    @EJB
    private ScriptFacade scriptManager;
    /**
     * Used to store each transition triggered by a specific player
     */
    @Inject
    private RequestManager requestManager;
    /**
     * Stores passed transitions
     */
    private final Map<Player, HashSet<Transition>> playerTransitions = new HashMap<>();

    /**
     *
     */
    public StateMachineFacade() {
    }

    /**
     *
     * @param playerAction
     */
    public void PlayerActionListener(@Observes PlayerAction playerAction) {
        logger.debug("Received PlayerAction event");
        Player player = playerAction.getPlayer();
        if (player == null) {
            player = variableInstanceFacade.findAPlayer(requestManager.getUpdatedInstances().get(0));
        }
        this.runForPlayer(player);
//         this.playerUpdated(playerAction.getPlayer());
//        this.playerTransitions.clear();
    }

    public void resetEventListener(@Observes ResetEvent resetEvent) {
        logger.debug("Received Reset event");
        System.out.println("ResetEvent");
        for (Player player : resetEvent.getConcernedPlayers()) {
//            this.playerUpdated(player);
            this.runForPlayer(player);
        }
//        this.playerTransitions.clear();
    }

    private void runForPlayer(Player player) {
        List<StateMachineDescriptor> statemachines = variableDescriptorFacade.findByClass(player.getGameModel(), StateMachineDescriptor.class);
        List<Transition> passed = new ArrayList<>();
        Integer steps = this.doSteps(player, passed, statemachines, 0);
        logger.info("#steps[" + steps + "] - Player {} triggered transition(s):{}", player.getName(), passed);
    }

    private Integer doSteps(Player player, List<Transition> passedTransitions, List<StateMachineDescriptor> stateMachineDescriptors, Integer steps) {

        List<Script> impacts = new ArrayList<>();
        List<Script> preImpacts = new ArrayList<>();
        List<Transition> transitions;
        StateMachineInstance smi;
        Boolean validTransition;
        Boolean transitionPassed = false;

        for (VariableDescriptor sm : stateMachineDescriptors) {
            validTransition = false;
            smi = (StateMachineInstance) sm.getInstance(player);
            if (!smi.getEnabled()) {
                continue;
            }
            transitions = smi.getCurrentState().getTransitions();
            for (Transition transition : transitions) {
                if (transition instanceof DialogueTransition) {                   //Dialogue, don't eval
                    continue;
                } else if (transition.getTriggerCondition() == null
                        || transition.getTriggerCondition().getContent() == null
                        || transition.getTriggerCondition().getContent().equals("")) {
                    validTransition = true;
                } else {
                    requestManager.setPlayer(player);
                    try {
                        validTransition = (Boolean) scriptManager.eval(transition.getTriggerCondition());
                    } catch (ScriptException ex) {
                    }
                }
                if (validTransition == null) {
                    throw new WegasException("Please review condition [" + sm.getLabel() + "]:\n"
                            + transition.getTriggerCondition().getContent());
                } else if (validTransition) {
                    if (passedTransitions.contains(transition)) {
                        /*
                         * Loop prevention : that player already passed through
                         * this transiton
                         */
                        logger.debug("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        passedTransitions.add(transition);
                        smi.setCurrentStateId(transition.getNextStateId());
                        preImpacts.add(transition.getPreStateImpact());
                        impacts.add(smi.getCurrentState().getOnEnterEvent());
                        smi.transitionHistoryAdd(transition.getId());
                        transitionPassed = true;
                    }
                }
            }
        }
        if (transitionPassed) {
            /*@DIRTY, @TODO : find something else : Runing scripts overrides previous state change Only for first Player (resetEvent). */
            variableDescriptorFacade.findByClass(player.getGameModel(), StateMachineDescriptor.class);
            preImpacts.addAll(impacts);
            try {
                requestManager.setPlayer(player);
                scriptManager.eval(preImpacts);
            } catch (ScriptException | WegasException ex) {
                logger.warn("Script failed ", ex);
            }
            steps++;
            steps = this.doSteps(player, passedTransitions, stateMachineDescriptors, steps);
        }
        return steps;

    }
}
