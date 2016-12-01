/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.*;
import com.wegas.core.event.internal.PlayerAction;
import com.wegas.core.event.internal.ResetEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.statemachine.*;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.EJBException;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Run state machines.
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class StateMachineFacade extends BaseFacade<StateMachineDescriptor> {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(StateMachineFacade.class);

    /**
     * Event parameter will be passed in a function with named parameter
     * {@value #EVENT_PARAMETER_NAME}
     */
    static final private String EVENT_PARAMETER_NAME = "param";

    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    @EJB
    private GameModelFacade gameModelFacade;

    @EJB
    private GameFacade gameFacade;

    @EJB
    private TeamFacade teamFacade;

    @EJB
    private PlayerFacade playerFacade;

    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    @EJB
    private ScriptFacade scriptManager;

    @Inject
    private RequestManager requestManager;

    @Inject
    private ScriptEventFacade scriptEvent;

    /**
     * Manage internal event transition.
     */
    private InternalStateMachineEventCounter stateMachineEventsCounter;

    /**
     *
     */
    public StateMachineFacade() {
        super(StateMachineDescriptor.class);
    }

    public Transition findTransition(Long transitionId) {
        return getEntityManager().find(Transition.class, transitionId);
    }

    /**
     * @param playerAction
     * @throws com.wegas.core.exception.internal.NoPlayerException
     */
    public void playerActionListener(@Observes PlayerAction playerAction) throws NoPlayerException, WegasScriptException {
        logger.debug("Received PlayerAction event");
        Player player = playerAction.getPlayer();
        if (player == null) {
            for (Entry<String, List<AbstractEntity>> entry : requestManager.getUpdatedEntities().entrySet()) {
                for (AbstractEntity entity : entry.getValue()) {
                    if (entity instanceof VariableInstance) {
                        player = variableInstanceFacade.findAPlayer((VariableInstance) entity);
                        break;
                    }
                }
                if (player != null) {
                    break;
                }
            }
            if (player == null) {
                throw new NoPlayerException("StateMachine Facade: NO PLAYER");
            }
        }

        this.runForPlayers(player);
        /*
        Force resources release
         */
        getEntityManager().flush();
        if (playerAction.getClear()) {
            getEntityManager().clear();
        }
    }

    private List<Player> getPlayerFromAudiences(List<String> audiences) {
        List<Player> players = new ArrayList<>();

        for (String audience : audiences) {
            String[] token = audience.split("-");
            Long id = Long.parseLong(token[1]);
            switch (token[0]) {
                case "GameModel":
                    for (Player p : gameModelFacade.find(id).getPlayers()) {
                        if (!players.contains(p)) {
                            players.add(p);
                        }
                    }
                    break;

                case "Game":
                    for (Player p : gameFacade.find(id).getPlayers()) {
                        if (!players.contains(p)) {
                            players.add(p);
                        }
                    }
                    break;
                case "Team":
                    for (Player p : teamFacade.find(id).getPlayers()) {
                        if (!players.contains(p)) {
                            players.add(p);
                        }
                    }
                    break;
                case "Player":
                    Player p = playerFacade.find(id);
                    if (!players.contains(p)) {
                        players.add(p);
                    }
                    break;
            }
        }
        return players;
    }

    private void populateWithPlayerInstance(Player p, List<StateMachineDescriptor> descriptors, Map<StateMachineInstance, Player> instances) {
        for (StateMachineDescriptor smd : descriptors) {
            StateMachineInstance instance = smd.getInstance(p);
            instances.putIfAbsent(instance, p);
        }
    }

    private List<String> getAudiences() {
        List<String> audiences = new ArrayList<>();

        for (Entry<String, List<AbstractEntity>> entry : requestManager.getJustUpdatedEntities().entrySet()) {
            for (AbstractEntity ae : entry.getValue()) {
                if (ae instanceof VariableInstance) {
                    audiences.add(entry.getKey());
                    break;
                }
            }
        }

        return audiences;
    }

    private Map<StateMachineInstance, Player> getStateMachineInstances(List<StateMachineDescriptor> descriptors, Player preferredPlayer) {
        /**
         * Using a linked hash map give a predictable iteration order, to be
         * sure preferred player instances will be processed first.
         *
         * This behaviour is required to ensure correct event handling (events
         * are store within player context, therby they're loosed when switching
         * to a new player)
         *
         */
        Map<StateMachineInstance, Player> instances = new LinkedHashMap<>();

        List<Player> playerFromAudiences = getPlayerFromAudiences(getAudiences());

        if (preferredPlayer != null) {
            populateWithPlayerInstance(preferredPlayer, descriptors, instances);
        }

        for (Player p : playerFromAudiences) {
            if (!p.equals(preferredPlayer)) {
                populateWithPlayerInstance(p, descriptors, instances);
            }
        }

        requestManager.migrateUpdateEntities();
        return instances;
    }

    /**
     * @param resetEvent
     */
    public void resetEventListener(@Observes ResetEvent resetEvent) throws WegasScriptException {
        logger.debug("Received Reset event");
        getEntityManager().flush();

        List<Player> concernedPlayers = resetEvent.getConcernedPlayers();
        Player player = null;
        if (concernedPlayers.size() > 0) {
            player = concernedPlayers.get(0);
        }
        this.runForPlayers(player);
    }

    private List<StateMachineDescriptor> getAllStateMachines(final GameModel gameModel) {
        final List<VariableDescriptor> variableDescriptors = gameModel.getVariableDescriptors();
        final List<StateMachineDescriptor> stateMachineDescriptors = new ArrayList<>();
        for (VariableDescriptor vd : variableDescriptors) {
            if (vd instanceof StateMachineDescriptor) {
                stateMachineDescriptors.add((StateMachineDescriptor) vd);
            }
        }
        return stateMachineDescriptors;
    }

    private void runForPlayers(Player preferredPlayer) throws WegasScriptException {
        List<StateMachineDescriptor> statemachines = this.getAllStateMachines(preferredPlayer.getGameModel());
        List<String> passed = new ArrayList<>();

        stateMachineEventsCounter = new InternalStateMachineEventCounter();

        Map<StateMachineInstance, Player> instances;

        int step = 0;

        do {
            instances = getStateMachineInstances(statemachines, preferredPlayer);
            this.run(instances, passed);
            this.flush();
            step++;
            logger.info("#steps[" + step + "] - Player triggered transition(s):{}", passed);
        } while (!requestManager.getJustUpdatedEntities().isEmpty());

        stateMachineEventsCounter = null;
    }

    private static final class SelectedTransition {

        Player player;
        StateMachineInstance stateMachineInstance;
        Transition transition;

        public SelectedTransition(Player player, StateMachineInstance stateMachineInstance, Transition transition) {
            this.player = player;
            this.stateMachineInstance = stateMachineInstance;
            this.transition = transition;
        }

        @Override
        public String toString() {
            return "SelectedTransition{player: " + player + "; fsmi: " + stateMachineInstance + " ; transition: " + transition + "}";
        }
    };

    private void run(Map<StateMachineInstance, Player> instances, List<String> passedTransitions) throws WegasScriptException {

        List<SelectedTransition> selectedTransitions = new ArrayList<>();

        List<Transition> transitions;
        StateMachineInstance smi;
        Boolean validTransition;
        Boolean transitionPassed = false;
        StateMachineDescriptor sm;
        Player player;

        for (Entry<StateMachineInstance, Player> entry : instances.entrySet()) {
            smi = entry.getKey();
            sm = (StateMachineDescriptor) smi.getDescriptor();

            player = entry.getValue();
            validTransition = false;
            //smi = sm.getInstance(player);
            if (!smi.getEnabled() || smi.getCurrentState() == null) { // a state may not be defined : remove statemachine's state when a player is inside that state
                continue;
            }
            transitions = smi.getCurrentState().getTransitions();
            for (Transition transition : transitions) {
                String transitionUID = smi.getId() + "-" + transition.getId();
                if (validTransition) {
                    break; // already have a valid transition
                }
                if (transition instanceof DialogueTransition
                        && ((DialogueTransition) transition).getActionText() != null
                        && !((DialogueTransition) transition).getActionText().isEmpty()) {                 // Dialogue, don't eval if not null or empty
                    continue;
                } else if (this.isNotDefined(transition.getTriggerCondition())) {
                    validTransition = true;
                } else if (transition.getTriggerCondition().getContent().contains("Event.fired")) { //TODO: better way to find out which are event transition.
                    if (passedTransitions.contains(transitionUID)) {
                        /*
                         * Loop prevention : that player already passed through
                         * this transiton
                         */
                        logger.debug("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        try {
                            if (this.eventTransition(player, transition, sm, smi)) {
                                validTransition = true;
                            }
                        } catch (WegasScriptException ex) {
                            ex.setScript("Variable " + sm.getLabel());
                            requestManager.addException(ex);
                            //validTransition still false
                        }
                    }

                } else {
                    try {
                        validTransition = (Boolean) scriptManager.eval(player, transition.getTriggerCondition(), sm);
                    } catch (EJBException ex) {
                        logger.error("Transition eval exception: FSM " + sm.getName() + ":" + sm.getId() + ":" + transition.getTriggerCondition().getContent());
                        throw ex;
                    } catch (WegasScriptException ex) {
                        ex.setScript("Variable " + sm.getLabel());
                        requestManager.addException(ex);
                        //validTransition still false
                    }
                }

                if (validTransition == null) {
                    throw WegasErrorMessage.error("Please review condition [" + sm.getLabel() + "]:\n"
                            + transition.getTriggerCondition().getContent());
                } else if (validTransition) {
                    if (passedTransitions.contains(transitionUID)) {
                        /*
                         * Loop prevention : that player already passed through
                         * this transiton
                         */
                        logger.debug("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        passedTransitions.add(transitionUID);
                        smi.setCurrentStateId(transition.getNextStateId());

                        selectedTransitions.add(new SelectedTransition(player, smi, transition));

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

        if (transitionPassed) {
            /* WHAT ? */
 /*@DIRTY, @TODO : find something else : Running scripts overrides previous state change Only for first Player (resetEvent). */
 /* Fixed by lib, currently commenting it  @removeme */
//            this.getAllStateMachines(player.getGameModel());

            for (SelectedTransition selectedTransition : selectedTransitions) {
                //for (Map.Entry<StateMachineInstance, Transition> entry : selectedTransitions.entrySet()) {

                StateMachineInstance fsmi = selectedTransition.stateMachineInstance;
                Transition transition = selectedTransition.transition;
                player = selectedTransition.player;

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
        }
    }

    /**
     * Manage event transition
     *
     * @param player     current {@link Player}
     * @param transition the event transition
     * @param smi        current {@link StateMachineInstance} passing transition
     * @return
     */
    private Boolean eventTransition(Player player, Transition transition, StateMachineDescriptor sm, StateMachineInstance smi) throws WegasScriptException {
        String script = transition.getTriggerCondition().getContent();
        Pattern pattern = Pattern.compile("Event\\.fired\\([ ]*(['\"])(.+?)\\1[ ]*\\)");
        Matcher matcher = pattern.matcher(script);
        String event;
        if (matcher.find()) {
            event = matcher.group(2);
        } else {
            return false;
        }
        Object[] firedParams = scriptEvent.getFiredParameters(event);
        /* events and more ? */
        if (!(Boolean) scriptManager.eval(player, transition.getTriggerCondition(), sm)) {
            return false;
        }
        final Integer instanceEventCount = stateMachineEventsCounter.count(smi, event);
        if (firedParams.length > instanceEventCount) {
            smi.setCurrentStateId(transition.getNextStateId());
            stateMachineEventsCounter.increase(smi, event);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Test if a script is not defined, ie empty or null
     *
     * @param script to test
     * @return
     */
    private Boolean isNotDefined(Script script) {
        return script == null || script.getContent() == null
                || script.getContent().equals("");
    }

    public StateMachineInstance doTransition(Long gameModelId, Long playerId, Long stateMachineDescriptorId, Long transitionId) {
        final Player player = playerFacade.find(playerId);
        StateMachineDescriptor stateMachineDescriptor
                = (StateMachineDescriptor) variableDescriptorFacade.find(stateMachineDescriptorId);
        StateMachineInstance stateMachineInstance = stateMachineDescriptor.getInstance(player);
        State currentState = stateMachineInstance.getCurrentState();
        List<Script> impacts = new ArrayList<>();

        Transition transition = findTransition(transitionId);

        if (transition instanceof DialogueTransition && currentState.equals(transition.getState())) {
            if (isTransitionValid((DialogueTransition) transition, playerId, stateMachineDescriptor)) {
                if (transition.getPreStateImpact() != null) {
                    impacts.add(transition.getPreStateImpact());
                }
                stateMachineInstance.setCurrentStateId(transition.getNextStateId());
                stateMachineInstance.transitionHistoryAdd(transitionId);
                State nextState = stateMachineInstance.getCurrentState();

                requestManager.addEntity(stateMachineInstance.getAudience(), stateMachineInstance, requestManager.getUpdatedEntities());
                /* Force in case next state == current state */

                if (stateMachineInstance.getCurrentState().getOnEnterEvent() != null) {
                    impacts.add(stateMachineInstance.getCurrentState().getOnEnterEvent());
                }
                scriptManager.eval(player, impacts, stateMachineDescriptor);

                try {
                    scriptEvent.fire(player, "dialogueResponse", new TransitionTraveled(stateMachineDescriptor, stateMachineInstance, transition, currentState, nextState));
                } catch (WegasRuntimeException e) {
                    logger.error("EventListener error (\"dialogueResponse\")", e);
                    // GOTCHA no eventManager is instantiated
                }
            }
        }
        return stateMachineInstance;
    }

    @Override
    public void create(StateMachineDescriptor entity) {
        variableDescriptorFacade.create(entity);
    }

    @Override
    public void remove(StateMachineDescriptor entity) {
        variableDescriptorFacade.remove(entity);
    }

    /**
     * Access from nashhorn event callback
     */
    public static class TransitionTraveled {

        final public StateMachineDescriptor descriptor;
        final public StateMachineInstance instance;
        final public Transition transition;
        final public State from;
        final public State to;

        private TransitionTraveled(StateMachineDescriptor descriptor, StateMachineInstance instance, Transition transition, State from, State to) {
            this.descriptor = descriptor;
            this.instance = instance;
            this.transition = transition;
            this.from = from;
            this.to = to;
        }
    }

    /**
     * Used to store Events during run. Prevent passing multiple event
     * transitions with same event if less events where thrown.
     * StateMachineInstance dependant.
     */
    private static class InternalStateMachineEventCounter {

        private final Map<StateMachineInstance, Map<String, Integer>> smEvents;

        private InternalStateMachineEventCounter() {
            this.smEvents = new HashMap<>();
        }

        private Integer count(StateMachineInstance instance, String event) {
            if (!smEvents.containsKey(instance)) {
                smEvents.put(instance, new HashMap<>());
            }
            if (smEvents.get(instance).containsKey(event)) {
                return smEvents.get(instance).get(event);
            } else {
                return 0;
            }
        }

        private void increase(StateMachineInstance instance, String event) {
            if (!smEvents.containsKey(instance)) {
                smEvents.put(instance, new HashMap<>());
            }
            smEvents.get(instance).put(event, this.count(instance, event) + 1);
        }

    }

    public long countValidTransition(DialogueDescriptor dialogueDescriptor, Player currentPlayer) {
        long count = 0;
        DialogueState currentState = (DialogueState) dialogueDescriptor.getInstance(currentPlayer).getCurrentState();
        for (Transition transition : currentState.getTransitions()) {
            if (isTransitionValid((DialogueTransition) transition, currentPlayer.getId(), dialogueDescriptor)) {
                count++;
            }
        }
        return count;
    }

    private boolean isTransitionValid(DialogueTransition transition, Long playerId, StateMachineDescriptor context) {
        boolean valid = true;

        if (transition.getTriggerCondition() != null && !transition.getTriggerCondition().getContent().equals("")) {
            valid = (Boolean) scriptManager.eval(playerId, transition.getTriggerCondition(), context);
        }
        return valid;
    }
}
