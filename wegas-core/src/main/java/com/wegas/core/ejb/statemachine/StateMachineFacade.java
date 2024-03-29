/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.Scriptable;
import com.wegas.core.api.StateMachineFacadeI;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.ejb.nashorn.ConditionAnalyser;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
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
import com.wegas.core.persistence.variable.statemachine.TransitionDependency;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.core.security.util.ScriptExecutionContext;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import jakarta.ejb.EJBException;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
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
    public void runStateMachines(InstanceOwner context, boolean forceEvalAll) throws WegasScriptException {

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

        //logger.debug("Received Reset event");
        //getEntityManager().flush();
        for (Player player : players) {
            this.runForPlayer(player, forceEvalAll);
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

    private void runForPlayer(Player player, boolean forceEvalAll) throws WegasScriptException {
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            // State machine only contains internal scripts
            try (ScriptExecutionContext ctx = requestManager.switchToInternalExecContext(true)) {
                List<AbstractStateMachineDescriptor> statemachines = this.getAllStateMachines(player.getGameModel());
                HashSet<AbstractTransition> passed = new HashSet<>();
                //stateMachineEventsCounter = new InternalStateMachineEventCounter();
                Integer steps = this.doSteps(player, passed, statemachines, 0, forceEvalAll);
                logger.info("#steps[{}] - Player {} triggered transition(s):{}", steps, player.getName(), passed);
                //stateMachineEventsCounter = null;
                /*
             * Force resources release
                 */
                //getEntityManager().flush();
            }
        }
    }

    /**
     *
     * @param player
     * @param passedTransitions       list of transition already walked in this run
     * @param stateMachineDescriptors all fsmD
     * @param steps                   current stem number
     * @param forceEvalAll            if true, bypass the transitionDependency optimisation
     *
     * @return total number of steps
     *
     * @throws WegasScriptException
     */
    private Integer doSteps(Player player, HashSet<AbstractTransition> passedTransitions, List<AbstractStateMachineDescriptor> stateMachineDescriptors, Integer steps, boolean forceEvalAll) throws WegasScriptException {

        Map<StateMachineInstance, AbstractTransition> selectedTransitions = new HashMap<>();

        // flush to collect all updated entities
        requestManager.flush();
        Set<AbstractEntity> touched = requestManager.getJustUpdatedEntities();

        Set<VariableDescriptor> desc = !forceEvalAll ? touched.stream()
            .map(entity -> entity.findFirstOfType(VariableDescriptor.class))
            .filter(entity -> entity != null)
            .collect(Collectors.toSet()) : Set.of();

        for (AbstractStateMachineDescriptor sm : stateMachineDescriptors) {
            logger.trace("Process FSM {}", sm);
            if (sm != null) {
                StateMachineInstance smi = (StateMachineInstance) variableDescriptorFacade.getInstance(sm, player);
                AbstractState currentState = smi.getCurrentState();
                if (!smi.getEnabled() || currentState == null) { // a state may not be defined : remove statemachine's state when a player is inside that state
                    continue;
                }
                // if the current state machine has just been modified, it has to be evaluated in
                // all cases because:
                // the state machine may have been just activated
                // it may have changed its currentState
                boolean forceEval = forceEvalAll || desc.contains(sm);

                for (AbstractTransition transition : (List<AbstractTransition>) currentState.getTransitions()) {
                    logger.trace("Process FSM Transition {}", transition);

                    if(passedTransitions.contains(transition)){
                        /*
                        * Loop prevention : that player already passed through this transition
                        */
                        logger.debug("Loop detected, already marked {} IN {}", transition, passedTransitions);
                        continue;
                        /*
                        * FSM3 Breaking Change
                        * If the blocked transition depends on some variables, such a
                        * transition will no longer be triggered at the next eval (even if the
                        * condition is actually true) but will requires a dep updated to be
                        * evaluated again.
                        */
                    }

                    Set<TransitionDependency> deps = transition.getDependencies();
                    if (!forceEval && !deps.isEmpty()) {
                        boolean mustEval = false;
                        for (TransitionDependency dep : deps) {
                            VariableDescriptor variable = dep.getVariable();
                            if (dep.getScope() == DependencyScope.UNKNOWN) {
                                // Unknown scope forces evaluation
                                mustEval = true;
                                break;
                            } else if (desc.contains(variable)) {
                                // the deps has just been modified
                                mustEval = true;
                                break;
                            } else if (dep.getScope() == DependencyScope.CHILDREN) {
                                List<VariableDescriptor> allChildren = variableDescriptorFacade.getAllChildren(variable);
                                for (VariableDescriptor vd : allChildren) {
                                    if (desc.contains(vd)) {
                                        mustEval = true;
                                        break;
                                    }
                                }
                                if (mustEval) {
                                    break;
                                }
                            }
                        }
                        if (!mustEval) {
                            // no dependencies related to this transition, skip it
                            continue;
                        }
                    }
                    logger.info("Eval {} transition", transition);
                    requestManager.getEventCounter().clearCurrents();

                    Boolean validTransition = false;

                    if (transition instanceof DialogueTransition
                        && ((DialogueTransition) transition).getActionText() != null
                        && !((DialogueTransition) transition).getActionText().translateOrEmpty(player).isEmpty()) {// Dialogue, don't eval if not null or empty

                        logger.trace("Ignore dialogue transition (explicit user action is requiered)");
                        continue;
                    } else if (this.isNotDefined(transition.getTriggerCondition())) {
                        logger.trace("Select This transition (no condition defined)");
                        validTransition = true;
                    } else {
                        try {
                            logger.trace("Eval the condition \"{}\"", transition.getTriggerCondition().getContent());
                            validTransition = (Boolean) scriptManager.eval(player, transition.getTriggerCondition(), sm);
                            logger.trace("Eval result: {}", validTransition);
                        } catch (EJBException ex) {
                            logger.error("Transition eval exception: FSM {}:{}:{}",
                                sm.getName(),
                                sm.getId(),
                                transition.getTriggerCondition().getContent());
                            throw ex;
                        } catch (WegasScriptException ex) {
                            logger.trace("WegasScriptException: {}", ex);
                            Long stateId = transition.getState().getIndex();
                            Long nextStateId = transition.getNextStateId();
                            sm.getEditorLabel();
                            ex.setScript("Transition from state #"
                                + stateId + " to state #" + nextStateId
                                + " of StateMachine name=" + sm.getName() + " \""
                                + sm.getEditorLabel()
                                + "\": " + ex.getScript());
                            requestManager.addException(ex);
                            //validTransition still false
                        }
                    }

                    if (validTransition == null) {
                        logger.trace("Condition returned null !");
                        throw WegasErrorMessage.error("Please review condition [" + sm.getLabel() + "]:\n"
                            + transition.getTriggerCondition().getContent());
                    } else if (validTransition) {
                        logger.trace("Valid transition found");
                        
                        requestManager.getEventCounter().acceptCurrent(smi);
                        passedTransitions.add(transition);
                        smi.setCurrentStateId(transition.getNextStateId());

                        selectedTransitions.put(smi, transition);
                        smi.transitionHistoryAdd(transition.getId());
                        // transitionPassed = true;
                        if (sm instanceof TriggerDescriptor) {
                            TriggerDescriptor td = (TriggerDescriptor) sm;
                            if (td.isDisableSelf()) {
                                smi.setEnabled(false);
                            }
                        }
                        // matching transition found, stop searching for this state machine for this step
                        break;
                    }
                }
                requestManager.getEventCounter().clearCurrents();
            }
        }
        // all statemachines have been evaluated: migrate just-updated entities to updatedEntities
        // do it before applying impacts so impacts will populate brand new just-updated bag
        requestManager.migrateUpdateEntities();
        if (selectedTransitions.size() > 0) {
            /* WHAT ? @DIRTY, @TODO : find something else : Running scripts overrides previous state
             * change Only for first Player (resetEvent). Fixed by lib, currently commenting it
             * @removeme
             */
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
            steps = this.doSteps(player, passedTransitions, stateMachineDescriptors, steps, forceEvalAll);
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
        try (ScriptExecutionContext ctx = requestManager.switchToInternalExecContext(true)) {
            DialogueState currentState = (DialogueState) dialogueDescriptor.getInstance(currentPlayer).getCurrentState();
            for (DialogueTransition transition : currentState.getInternalTransitions()) {
                if (isTransitionValid(transition, currentPlayer.getId(), dialogueDescriptor)) {
                    count++;
                }
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

    /**
     * If dependOnMode is automatic, parse transition script and rebuild the list of dependencies.
     *
     * @param gameModel  the gameModel
     * @param transition the transition to analyze
     */
    public void analyseTransition(GameModel gameModel, AbstractTransition transition) {
        if (transition.getDependsOnStrategy() == AbstractTransition.DependsOnStrategy.AUTO) {
            Script script = transition.getTriggerCondition();
            String content = null;
            if (script != null) {
                content = script.getContent();
            }
            if (content == null) {
                content = "";
            }

            // extract all Variable.find(gameModel, <VARIABLENAME>).<METHOD>(...)
            List<ConditionAnalyser.VariableCall> calls = ConditionAnalyser.analyseCondition(content);

            // contains current deps only
            Set<TransitionDependency> currentDeps = new HashSet<>();
            currentDeps.addAll(transition.getDependencies());
            // contains deps to keep (pre-existing and new)
            Set<TransitionDependency> updatedDeps = new HashSet<>();

            calls.forEach(call -> {
                try {
                    VariableDescriptor vd = variableDescriptorFacade.find(gameModel, call.getVariableName());
                    for (Method m : vd.getClass().getMethods()) {
                        if (m.getName().equals(call.getMethodName())
                            && m.getAnnotation(Scriptable.class) != null) {
                            Scriptable annotation = m.getAnnotation(Scriptable.class);

                            if (annotation.dependsOn() != DependencyScope.NONE) {
                                TransitionDependency findDep = findDep(updatedDeps, vd);
                                if (findDep == null) {
                                    findDep = findDep(currentDeps, vd);
                                }

                                if (findDep != null) {
                                    // mark dep as updated
                                    updatedDeps.add(findDep);
                                    setScope(findDep, annotation.dependsOn());
                                } else {
                                    // new dep
                                    TransitionDependency newDep = new TransitionDependency();
                                    newDep.setTransition(transition);
                                    newDep.setVariable(vd);
                                    newDep.setScope(annotation.dependsOn());

                                    updatedDeps.add(newDep);
                                }
                            }
                            break;
                        }
                    }
                } catch (WegasNoResultException ex) {
                    // no-op ? what shall we do ?
                }
            });
            // fitler out updated deps
            transition.setDependencies(updatedDeps);

            currentDeps.removeAll(updatedDeps);
            // remaining deps are to be deleted
            currentDeps.forEach(dep -> {
                this.getEntityManager().remove(dep);
            });
        }
    }

    /**
     * find dep to the given variable.
     *
     * @param set  dep containers
     * @param desc needle
     *
     * @return the transition dependency which match the desc
     */
    private TransitionDependency findDep(Set<TransitionDependency> set, VariableDescriptor desc) {
        Optional<TransitionDependency> opt = set.stream().filter(dep -> dep.getVariable().equals(desc)).findAny();
        if (opt.isPresent()) {
            return opt.get();
        } else {
            return null;
        }
    }

    /**
     * Update the <code>dep</code> it scope to keep the mose wide-open (self &lt; children &lt;
     * unknown).
     *
     * @param dep   the dependency
     * @param scope the scope
     */
    public void setScope(TransitionDependency dep, DependencyScope scope) {
        DependencyScope currentScope = dep.getScope();
        //if both scopes equal, there is nothing to do (s-s, c-c, u-u)
        if (currentScope != scope) {
            // s-c, s-u, c-s, c-u, u-s, u-c
            // scopes differ
            if (currentScope == DependencyScope.UNKNOWN || scope == DependencyScope.UNKNOWN) {
                // at least one is unknown -> unknown
                // s-u, c-u, u-s, u-c
                dep.setScope(DependencyScope.UNKNOWN);
            } else {
                // c-s, s-c => children
                dep.setScope(DependencyScope.CHILDREN);
            }
        }
    }

    /**
     * Go through all transitions of the statemachine and rebuild their dependencies.
     * <p>
     * If the strategy is "automatic", try to understand which variables the conditions depends on.
     *
     * @param gameModel the gameModel
     * @param vd        the stateMachine
     */
    public void reviveStateMachine(GameModel gameModel, AbstractStateMachineDescriptor vd) {
        Collection<AbstractState> values = vd.getStates().values();
        values.forEach(state -> {
            List<AbstractTransition> transitions = state.getInternalTransitions();
            transitions.forEach(transition -> {
                // In all case, revive exising dependencies
                transition.getDependencies().forEach(tDep -> {
                    try {
                        VariableDescriptor dep = variableDescriptorFacade.find(gameModel, tDep.getImportedVariableName());
                        if (dep != null) {
                            tDep.setVariable(dep);
                        } else {
                            logger.error("Revive {}/{}/{}: povided dependencydoes not exists: {}",
                                vd, state, transition, tDep);
                        }
                    } catch (WegasNoResultException ex) {
                        // no-op
                    }

                });

                if (transition.getDependsOnStrategy() == AbstractTransition.DependsOnStrategy.AUTO) {
                    // If auto, update dependencies
                    this.analyseTransition(gameModel, transition);
                }
            });
        });

        if (vd instanceof DialogueDescriptor) {
            this.reviveDialogue(gameModel, (DialogueDescriptor) vd);
        }
    }

    public void reviveDialogue(GameModel gameModel, DialogueDescriptor dialogueDescriptor) {
        for (DialogueState s : dialogueDescriptor.getInternalStates()) {
            if (s.getText() != null) {
                s.getText().setParentDescriptor(dialogueDescriptor);
            }

            for (DialogueTransition t : s.getInternalTransitions()) {
                if (t.getActionText() != null) {
                    t.getActionText().setParentDescriptor(dialogueDescriptor);
                }
            }
        }
    }

}
