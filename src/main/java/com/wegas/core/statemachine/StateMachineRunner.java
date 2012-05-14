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

import com.wegas.core.ejb.GameManager;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
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
    private ScriptManager scriptManager;
    /**
     * StateMachineRunner is running
     */
    private Boolean run = false;
    private Integer steps = 0;
    private HashSet<StateMachineInstanceEntity> stateMachines = new HashSet<>();
    private HashSet<Transition> passedTransitions = new HashSet<>();
    @Inject
    private GameManager gameManager;

    public StateMachineRunner() {
    }

    public void entityUpdateListener(@Observes GameManager.PlayerAction playerAction) {
        if (run) {
            logger.info("Running, received changed {}", gameManager.getUpdatedInstances());
            return;
        }
        //gameManager.clearUpdatedInstances();
        //TODO: Should Eval without firing Event, lock SMInstance (concurrency)
        run = true;
        if (stateMachines.isEmpty()) {                                          // load stateMachines only once
            GameModelEntity gamemodel = gameManager.getGameModel();
            List<VariableDescriptorEntity> stateMachineDescriptors = variableDescriptorFacade.findByClass(gamemodel,StateMachineDescriptorEntity.class);
            for (VariableDescriptorEntity stateMachineDescriptor : stateMachineDescriptors) {
                stateMachines.add((StateMachineInstanceEntity) stateMachineDescriptor.getScope().getVariableInstance(gameManager.getCurrentPlayer()));
            }
            logger.info("StateMachineInstance(s) found: {}", stateMachines);
        }
        //Put that in the SM Facade
        ArrayList<ScriptEntity> impacts = new ArrayList<>();
        for (StateMachineInstanceEntity stateMachine : stateMachines) {
            List<Transition> transitions = stateMachine.getCurrentState().getTransitions();
            for (Transition transition : transitions) {
                Boolean validTransition = false;
                try {
                    validTransition = (Boolean) scriptManager.eval(gameManager.getCurrentPlayer(), transition.getTriggerCondition());
                }
                catch (ScriptException ex) {
                    logger.error("Script Failed : {} returned: {}", transition.getTriggerCondition(), ex);
                }
                if (validTransition) {
                    if (passedTransitions.contains(transition)) {
                        logger.warn("Loop detected, already marked {} IN {}", transition, passedTransitions);
                    } else {
                        stateMachine.setCurrentStateId(transition.getNextStateId());
                        impacts.add(stateMachine.getCurrentState().getOnEnterEvent());
                        passedTransitions.add(transition);
                        break;
                    }
                }

            }
        }
        steps += 1;
        run = false;
        try {
            scriptManager.eval(gameManager.getCurrentPlayer(), impacts, null);
        }
        catch (ScriptException ex) {
            logger.error("Script Failed : {} returned: {}", impacts, ex);
        }
    }

    @PreDestroy
    public void logFinalState() {
        logger.info("#steps[" + steps + "] - Player {} triggered transition(s):{}", gameManager.getCurrentPlayer().getId(), passedTransitions);
    }
}
