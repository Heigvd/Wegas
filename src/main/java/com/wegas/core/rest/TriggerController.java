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
package com.wegas.core.rest;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptorEntity;
import com.wegas.core.statemachine.TriggerDescriptorFacade;
import java.util.HashMap;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Trigger/")
public class TriggerController extends AbstractRestController<TriggerDescriptorFacade> {

    @EJB
    private TriggerDescriptorFacade triggerDescriptorFacade;

    @Override
    protected TriggerDescriptorFacade getFacade() {
        return this.triggerDescriptorFacade;
    }

    @Override
    public TriggerDescriptorEntity create(AbstractEntity entity) {
        Long gameModelId = new Long(this.getPathParam("gameModelId"));
        TriggerDescriptorEntity trigger = (TriggerDescriptorEntity) entity;
        State initialState = new State(), finalState = new State();
        Transition transition = new Transition();
        transition.setTriggerCondition(trigger.getTriggerEvent());
        List<Transition> transitions = initialState.getTransitions();
        transitions.add(transition);
        initialState.setTransitions(transitions);
        HashMap<Long, State> states = new HashMap<>();
        if (trigger.isOneShot()) {
            trigger.setOpposedTrigger(false);
            transition.setNextState(2L);
            finalState.setOnEnterEvent(trigger.getPostTriggerEvent());
            states.put(2L, finalState);
        } else if (trigger.isOpposedTrigger()) {
            transition.setNextState(2L);
            finalState.setOnEnterEvent(trigger.getPostTriggerEvent());
            Transition returnTransition = new Transition();
            returnTransition.setNextState(1L);
            //TODO : Not(triggerEvent)
            returnTransition.setTriggerCondition(trigger.getTriggerEvent());
            returnTransition.setNextState(1L);
            List<Transition> returnTransitions = finalState.getTransitions();
            returnTransitions.add(returnTransition);
            finalState.setTransitions(returnTransitions);
            states.put(2L, finalState);
        } else {
            transition.setNextState(1L);
            initialState.setOnEnterEvent(trigger.getPostTriggerEvent());
        }
        states.put(1L, initialState);
        trigger.setInitialStateId(1L);
        trigger.setStates(states);
        this.triggerDescriptorFacade.create(gameModelId, trigger);
        return trigger;
    }
}
