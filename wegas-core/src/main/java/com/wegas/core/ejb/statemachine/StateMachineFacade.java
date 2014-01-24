/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptEvent;
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
import javax.script.Invocable;
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
    @Inject
    private ScriptEvent scriptEvent;

    private InternalStateMachineEventCounter stateMachineEventsCounter;

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
    }

    public void resetEventListener(@Observes ResetEvent resetEvent) {
        logger.debug("Received Reset event");
        System.out.println("ResetEvent");
        for (Player player : resetEvent.getConcernedPlayers()) {
            this.runForPlayer(player);
        }
    }

    private void runForPlayer(Player player) {
        List<StateMachineDescriptor> statemachines = variableDescriptorFacade.findByClass(player.getGameModel(), StateMachineDescriptor.class);
        List<Transition> passed = new ArrayList<>();
        stateMachineEventsCounter = new InternalStateMachineEventCounter();
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
            if (!smi.getEnabled() || smi.getCurrentState() == null) { // a state may not be defined : remove statemachine's state when a player is inside that state
                continue;
            }
            transitions = smi.getCurrentState().getTransitions();
            for (Transition transition : transitions) {
                if (transition instanceof DialogueTransition) {                   //Dialogue, don't eval
                    continue;
                } else if (this.isNotDefined(transition.getTriggerCondition())) {
                    validTransition = true;
                } else if (transition.getTriggerCondition().getContent().contains("Event.fired")) { //TODO: better way to find out which are event transition.
                    if (passedTransitions.contains(transition)) {
                        /*
                         * Loop prevention : that player already passed through
                         * this transiton
                         */
                        logger.debug("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        if (this.eventTransition(transition, smi)) {
                            passedTransitions.add(transition);
                            transitionPassed = true;
                        }
                    }

                } else {
                    try {
                        validTransition = (Boolean) scriptManager.eval(player, transition.getTriggerCondition());
                    } catch (ScriptException ex) {
                        //validTransition still false
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
                scriptManager.eval(player, preImpacts);
            } catch (ScriptException | WegasException ex) {
                logger.warn("Script failed ", ex);
            }
            steps++;
            steps = this.doSteps(player, passedTransitions, stateMachineDescriptors, steps);
        }
        return steps;

    }

    /**
     * manage event transition
     *
     * @param transition
     */
    private Boolean eventTransition(Transition transition, StateMachineInstance smi) {
        String script = transition.getTriggerCondition().getContent();          //@TODO: To test, till I imagine a better way to define events.
        String event = script.split("[\'\"]")[1];
        Object[] fired = scriptEvent.fired(event);
        if (fired.length > stateMachineEventsCounter.count(smi, event)) {
            smi.setCurrentStateId(transition.getNextStateId());
            stateMachineEventsCounter.increase(smi, event);
            try {
                if (!this.isNotDefined(transition.getPreStateImpact())) {
                    final Object preImpactFunc = scriptManager.eval(transition.getPreStateImpact());
                    if (fired[0] instanceof ScriptEvent.EmptyObject) {
                        ((Invocable) requestManager.getCurrentEngine()).invokeMethod(preImpactFunc, "call", preImpactFunc);
                    } else {
                        ((Invocable) requestManager.getCurrentEngine()).invokeMethod(preImpactFunc, "call", preImpactFunc, fired[0]);
                    }
                }
                if (!this.isNotDefined(smi.getCurrentState().getOnEnterEvent())) {
                    final Object impactFunc = scriptManager.eval(smi.getCurrentState().getOnEnterEvent());
                    if (fired[0] instanceof ScriptEvent.EmptyObject) {
                        ((Invocable) requestManager.getCurrentEngine()).invokeMethod(impactFunc, "call", impactFunc);
                    } else {
                        ((Invocable) requestManager.getCurrentEngine()).invokeMethod(impactFunc, "call", impactFunc, fired[0]);
                    }
                }
            } catch (ScriptException | NoSuchMethodException ex) {
                logger.debug("Event transition script failed", ex);
            }
            return true;
        } else {
            return false;
        }
    }

    private Boolean isNotDefined(Script script) {
        return script == null || script.getContent() == null
                || script.getContent().equals("");
    }

    /**
     * Used to store Events during run.
     */
    private class InternalStateMachineEventCounter {

        private final Map<StateMachineInstance, Map<String, Integer>> smEvents;

        private InternalStateMachineEventCounter() {
            this.smEvents = new HashMap<>();
        }

        private Integer count(StateMachineInstance instance, String event) {
            if (!smEvents.containsKey(instance)) {
                smEvents.put(instance, new HashMap<String, Integer>());
            }
            if (smEvents.get(instance).containsKey(event)) {
                return smEvents.get(instance).get(event);
            } else {
                return 0;
            }
        }

        private void increase(StateMachineInstance instance, String event) {
            if (!smEvents.containsKey(instance)) {
                smEvents.put(instance, new HashMap<String, Integer>());
            }
            smEvents.get(instance).put(event, this.count(instance, event) + 1);
        }

    }
}
