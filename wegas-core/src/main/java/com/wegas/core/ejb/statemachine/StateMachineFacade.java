/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.api.StateMachineFacadeI;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.statemachine.AbstractState;
import com.wegas.core.persistence.variable.statemachine.AbstractStateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;
import com.wegas.core.persistence.variable.statemachine.DialogueState;
import com.wegas.core.persistence.variable.statemachine.DialogueTransition;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ejb.EJBException;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import org.slf4j.LoggerFactory;

/**
 * Run state machines.
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class StateMachineFacade extends WegasAbstractFacade implements StateMachineFacadeI {
//public class StateMachineFacade extends BaseFacade<AbstractStateMachineDescriptor> implements  StateMachineFacadeI {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(StateMachineFacade.class);

    /**
     * Event parameter will be passed in a function with named parameter
     * {@value #EVENT_PARAMETER_NAME}
     */
    //static final private String EVENT_PARAMETER_NAME = "param";

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;
    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private ScriptFacade scriptManager;

    @Inject
    private ScriptEventFacade scriptEvent;

    public AbstractTransition findTransition(Long transitionId) {
        return getEntityManager().find(AbstractTransition.class, transitionId);
    }

    /**
     * Run stateMachine for all players within the given context
     *
     * @param context a gameModel, a game, a team or a player
     */
    public void runStateMachines(InstanceOwner context) throws WegasScriptException {

        List<Player> players;
        if (context == null || context.getPlayers() == null) {
            logger.error("No Player Provided...");
            Player player = null;
            for (AbstractEntity entity : requestManager.getUpdatedEntities()) {
                if (entity instanceof VariableInstance) {
                    VariableInstance vi = (VariableInstance) entity;
                    InstanceOwner owner = vi.getOwner();
                    if (owner != null) {
                        player = owner.getUserLivePlayerOrDebugPlayer(requestManager.getCurrentUser());
                    }
                    break;
                }
                if (player != null) {
                    break;
                }
            }
            if (player == null) {
                throw WegasErrorMessage.error("StateMachine Facade: NO PLAYER");
            }
            players = new ArrayList<>();
            players.add(player);
        } else {
            players = context.getPlayers();
        }

        logger.debug("Received Reset event");

        //getEntityManager().flush();
        for (Player player : players) {
            this.runForPlayer(player);
        }
    }

    /**
     * Get all stateMachine defined within the gameModel
     *
     * @param gameModel the gameModel we search state machine in
     *
     * @return all stateMachines which exists in gameModel
     */
    private List<AbstractStateMachineDescriptor> getAllStateMachines(final GameModel gameModel) {
        final Collection<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();
        final List<AbstractStateMachineDescriptor> stateMachineDescriptors = new ArrayList<>();
        for (VariableDescriptor vd : variableDescriptors) {
            if (vd instanceof AbstractStateMachineDescriptor) {
                stateMachineDescriptors.add((AbstractStateMachineDescriptor) vd);
            }
        }
        return stateMachineDescriptors;
    }

    private void runForPlayer(Player player) throws WegasScriptException {
        List<AbstractStateMachineDescriptor> statemachines = this.getAllStateMachines(player.getGameModel());
        List<AbstractTransition> passed = new ArrayList<>();
        //stateMachineEventsCounter = new InternalStateMachineEventCounter();
        Integer steps = this.doSteps(player, passed, statemachines, 0);
        logger.info("#steps[{}] - Player {} triggered transition(s):{}", steps, player.getName(), passed);
        //stateMachineEventsCounter = null;
        /*
        Force resources release
         */
        //getEntityManager().flush();
    }

    private Integer doSteps(Player player, List<AbstractTransition> passedTransitions, List<AbstractStateMachineDescriptor> stateMachineDescriptors, Integer steps) throws WegasScriptException {

        Map<StateMachineInstance, AbstractTransition> selectedTransitions = new HashMap<>();

        StateMachineInstance smi;
        Boolean validTransition;
        Boolean transitionPassed = false;

        for (AbstractStateMachineDescriptor sm : stateMachineDescriptors) {
            logger.trace("Process FSM {}", sm);
            if (sm != null) {
                validTransition = false;
                smi = (StateMachineInstance) variableDescriptorFacade.getInstance(sm, player);
                AbstractState currentState = smi.getCurrentState();
                if (!smi.getEnabled() || currentState == null) { // a state may not be defined : remove statemachine's state when a player is inside that state
                    continue;
                }
                for (AbstractTransition transition : (List<AbstractTransition>) currentState.getSortedTransitions()) {
                    logger.trace("Process FSM Transition {}", transition);
                    requestManager.getEventCounter().clearCurrents();

                    if (validTransition) {
                        break; // already have a valid transition
                    }
                    if (transition instanceof DialogueTransition
                            && ((DialogueTransition) transition).getActionText() != null
                            && !((DialogueTransition) transition).getActionText().translateOrEmpty(player).isEmpty()) {                 // Dialogue, don't eval if not null or empty

                        logger.trace("Ignore dialogue transition (explicit user action is requiered)");
                        continue;
                    } else if (this.isNotDefined(transition.getTriggerCondition())) {
                        logger.trace("Select This transition (no condition defined)");
                        validTransition = true;
                    } else {
                        try {
                            logger.trace("Eval the condition \"{}\"", transition.getTriggerCondition().getContent());
                            //validTransition = (Boolean) scriptManager.eval(player, transition, sm);
                            validTransition = (Boolean) scriptManager.eval(player, transition.getTriggerCondition(), sm);
                            logger.trace("Eval result: {}", validTransition);
                        } catch (EJBException ex) {
                            logger.error("Transition eval exception: FSM {}:{}:{}", sm.getName(), sm.getId(), transition.getTriggerCondition().getContent());
                            throw ex;
                        } catch (WegasScriptException ex) {
                            logger.trace("WegasScriptException: {}", ex);
                            Long stateId = transition.getState().getIndex();
                            Long nextStateId = transition.getNextStateId();
                            ex.setScript("Transition from state #" + stateId + " to state #" + nextStateId + " of StateMachine \"" + sm.getLabel() + "\"");
                            requestManager.addException(ex);
                            //validTransition still false
                        }
                    }
                    if (validTransition == null) {
                        logger.trace("Condition return null !");
                        throw WegasErrorMessage.error("Please review condition [" + sm.getLabel() + "]:\n"
                                + transition.getTriggerCondition().getContent());
                    } else if (validTransition) {
                        logger.trace("Valid transition found");
                        if (passedTransitions.contains(transition)) {
                            /*
                             * Loop prevention : that player already passed through
                             * this transiton
                             */
                            logger.debug("Loop detected, already marked {} IN {}", transition, passedTransitions);
                        } else {
                            requestManager.getEventCounter().acceptCurrent(smi);
                            passedTransitions.add(transition);
                            smi.setCurrentStateId(transition.getNextStateId());

                            selectedTransitions.put(smi, transition);
                            smi.transitionHistoryAdd(transition.getId());
                            transitionPassed = true;
                            if (sm instanceof TriggerDescriptor) {
                                TriggerDescriptor td = (TriggerDescriptor) sm;
                                if (td.isDisableSelf()) {
                                    smi.setEnabled(false);
                                }
                            }
                        }
                    }
                }
            }
        }
        if (transitionPassed) {
            /* WHAT ? */
 /*@DIRTY, @TODO : find something else : Running scripts overrides previous state change Only for first Player (resetEvent). */
 /* Fixed by lib, currently commenting it  @removeme */
            //            this.getAllStateMachines(player.getGameModel());
            logger.trace("Walk Selected Transitions");

            for (Map.Entry<StateMachineInstance, AbstractTransition> entry : selectedTransitions.entrySet()) {

                StateMachineInstance fsmi = entry.getKey();
                AbstractTransition transition = entry.getValue();
                List<Script> scripts = new ArrayList<>();

                scripts.add(transition.getPreStateImpact());
                scripts.add(fsmi.getCurrentState().getOnEnterEvent());

                try {
                    scriptManager.eval(player, scripts, fsmi.getDescriptor());
                } catch (WegasScriptException ex) {
                    ex.setScript("StateMachines impacts");
                    requestManager.addException(ex);
                    logger.warn("Script failed ", ex);
                }
            }
            steps++;
            steps = this.doSteps(player, passedTransitions, stateMachineDescriptors, steps);
        }
        return steps;

    }

    /**
     * Test if a script is not defined, ie empty or null
     *
     * @param script to test
     *
     * @return true if the script is undefined
     */
    private Boolean isNotDefined(Script script) {
        return script == null || script.getContent() == null
                || script.getContent().equals("");
    }

    public StateMachineInstance doTransition(Long gameModelId, Long playerId, Long stateMachineDescriptorId, Long transitionId) {

        final Player player = playerFacade.find(playerId);

        AbstractStateMachineDescriptor fsmD = (AbstractStateMachineDescriptor) variableDescriptorFacade.find(stateMachineDescriptorId);
        StateMachineInstance fsmI = (StateMachineInstance) fsmD.getInstance(player);

        if (fsmD instanceof DialogueDescriptor) {
            DialogueDescriptor dd = (DialogueDescriptor) fsmD;
            DialogueState currentState = (DialogueState) fsmI.getCurrentState();
            List<Script> impacts = new ArrayList<>();

            AbstractTransition aTransition = findTransition(transitionId);

            if (aTransition instanceof DialogueTransition
                    && currentState.equals(aTransition.getState())) {
                DialogueTransition transition = (DialogueTransition) aTransition;

                if (isTransitionValid(transition, playerId, dd)) {
                    if (transition.getPreStateImpact() != null) {
                        impacts.add(transition.getPreStateImpact());
                    }
                    fsmI.setCurrentStateId(transition.getNextStateId());
                    fsmI.transitionHistoryAdd(transitionId);
                    DialogueState nextState = (DialogueState) fsmI.getCurrentState();

                    requestManager.addUpdatedEntity(fsmI);
                    /* Force in case next state == current state */

                    if (fsmI.getCurrentState().getOnEnterEvent() != null) {
                        impacts.add(fsmI.getCurrentState().getOnEnterEvent());
                    }
                    scriptManager.eval(player, impacts, fsmD);

                    try {
                        scriptEvent.fire(player, "dialogueResponse", new TransitionTraveled(dd, fsmI, transition, currentState, nextState));
                    } catch (WegasRuntimeException e) {
                        logger.error("EventListener error (\"dialogueResponse\")", e);
                        // GOTCHA no eventManager is instantiated
                    }
                }
            }
        }
        return fsmI;
    }

    /**
     * Access from nashhorn event callback
     */
    public static class TransitionTraveled {

        final public AbstractStateMachineDescriptor descriptor;
        final public StateMachineInstance instance;
        final public DialogueTransition transition;
        final public DialogueState from;
        final public DialogueState to;

        private TransitionTraveled(DialogueDescriptor descriptor,
                StateMachineInstance instance,
                DialogueTransition transition,
                DialogueState from,
                DialogueState to) {
            this.descriptor = descriptor;
            this.instance = instance;
            this.transition = transition;
            this.from = from;
            this.to = to;
        }
    }

    @Override
    public long countValidTransition(DialogueDescriptor dialogueDescriptor, Player currentPlayer) {
        long count = 0;
        DialogueState currentState = (DialogueState) dialogueDescriptor.getInstance(currentPlayer).getCurrentState();
        for (DialogueTransition transition : currentState.getTransitions()) {
            if (isTransitionValid(transition, currentPlayer.getId(), dialogueDescriptor)) {
                count++;
            }
        }
        return count;
    }

    private boolean isTransitionValid(DialogueTransition transition, Long playerId, DialogueDescriptor context) {
        boolean valid = true;

        if (transition.getTriggerCondition() != null && !transition.getTriggerCondition().getContent().equals("")) {
            valid = (Boolean) scriptManager.eval(playerId, transition.getTriggerCondition(), context);
        }
        return valid;
    }
}
