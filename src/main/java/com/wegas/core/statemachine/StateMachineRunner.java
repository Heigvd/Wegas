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
package com.wegas.core.statemachine;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceManager;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.leaderway.persistence.DialogueTransition;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import javax.annotation.PreDestroy;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.script.ScriptException;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@RequestScoped
public class StateMachineRunner implements Serializable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(StateMachineRunner.class);
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    @EJB
    private ScriptFacade scriptManager;
    /**
     * StateMachineRunner is running
     */
    private Boolean run = false;
    private Integer steps = 0;
    private HashSet<StateMachineInstance> stateMachines = new HashSet<>();
    private HashSet<Transition> passedTransitions = new HashSet<>();
    @Inject
    private VariableInstanceManager gameManager;

    public StateMachineRunner() {
    }

    public void entityUpdateListener(@Observes VariableInstanceManager.PlayerAction playerAction) {
        if (run) {
            logger.info("Running, received changed {}", gameManager.getUpdatedInstances());
            return;
        }
        //gameManager.clearUpdatedInstances();
        //TODO: Should Eval without firing Event, lock SMInstance (concurrency)
        run = true;
        if (stateMachines.isEmpty()) {                                          // load stateMachines only once
            GameModel gamemodel = gameManager.getCurrentGameModel();
            List<VariableDescriptor> stateMachineDescriptors = variableDescriptorFacade.findByClass(gamemodel, StateMachineDescriptor.class);
            for (VariableDescriptor stateMachineDescriptor : stateMachineDescriptors) {
                stateMachines.add((StateMachineInstance) stateMachineDescriptor.getScope().getVariableInstance(gameManager.getCurrentPlayer()));
            }
            logger.info("StateMachineInstance(s) found: {}", stateMachines);
        }
        //Put that in the SM Facade
        ArrayList<Script> impacts = new ArrayList<>();
        for (StateMachineInstance stateMachine : stateMachines) {
            List<Transition> transitions = stateMachine.getCurrentState().getTransitions();
            for (Transition transition : transitions) {
                Boolean validTransition = false;
                try {
                    if (!(transition instanceof DialogueTransition) && transition.getTriggerCondition() != null) { //Do not eval Dialogue transition
                        validTransition = (Boolean) scriptManager.eval(gameManager.getCurrentPlayer(), transition.getTriggerCondition());
                    }
                } catch (ScriptException ex) {
                    logger.error("Script Failed : {} returned: {}", transition.getTriggerCondition(), ex);
                }
                if (validTransition) {
                    if (passedTransitions.contains(transition)) {
                        logger.warn("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        stateMachine.setCurrentStateId(transition.getNextStateId());
                        if (stateMachine.getCurrentState().getOnEnterEvent() != null) {
                            impacts.add(stateMachine.getCurrentState().getOnEnterEvent());
                        }
                        impacts.add(transition.getPreStateImpact());
                        passedTransitions.add(transition);
                        stateMachine.transitionHistoryAdd(transition.getId());  // Adding transition.id to history
                        break;
                    }
                }

            }
        }
        steps += 1;
        run = false;
        try {
            scriptManager.eval(gameManager.getCurrentPlayer(), impacts);
        } catch (ScriptException ex) {
            logger.error("Script Failed : {} returned: {}", impacts, ex);
        }
    }

    @PreDestroy
    public void logFinalState() {
        logger.info("#steps[" + steps + "] - Player {} triggered transition(s):{}", gameManager.getCurrentPlayer().getId(), passedTransitions);
    }
}
