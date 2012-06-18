/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "TriggerDescriptor")
@XmlRootElement
@XmlType(name = "TriggerDescriptor")
public class TriggerDescriptor extends StateMachineDescriptor {

    private Boolean oneShot;
    @Transient
    private Script triggerEvent;
    @Transient
    private Script postTriggerEvent;

    public TriggerDescriptor() {
    }

    public Boolean isOneShot() {
        return oneShot;
    }

    /**
     * Sets the trigger to be triggered only once.
     *
     * @param oneShot boolean defining a one time trigger
     */
    public void setOneShot(Boolean oneShot) {
        this.oneShot = oneShot;
    }

    public Script getPostTriggerEvent() {
        return postTriggerEvent;
    }

    /**
     * Sets the event executed once the trigger fires.
     *
     * @param postTriggerEvent a script to execute after this trigger executes
     */
    public void setPostTriggerEvent(Script postTriggerEvent) {
        this.postTriggerEvent = postTriggerEvent;
    }

    public Script getTriggerEvent() {
        return triggerEvent;
    }

    /**
     * Sets the script which fires the trigger.
     *
     * @param triggerEvent a script which fires the trigger
     */
    public void setTriggerEvent(Script triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    @Override
    public void merge(AbstractEntity a) {
        TriggerDescriptor entity = (TriggerDescriptor) a;
        this.oneShot = entity.isOneShot();
        this.postTriggerEvent = entity.getPostTriggerEvent();
        this.triggerEvent = entity.getTriggerEvent();
        entity.buildStateMachine();
        super.merge(entity);
    }

    @PostLoad
    public void onLoad() {
        try {
            this.triggerEvent = this.getStates().get(1L).getTransitions().get(0).getTriggerCondition();
        } catch (NullPointerException e) {
            this.triggerEvent = null;
        }
        try {
            if (this.oneShot) {
                this.postTriggerEvent = this.getStates().get(2L).getOnEnterEvent();
            } else {
                this.postTriggerEvent = this.getStates().get(1L).getOnEnterEvent();
            }
        } catch (NullPointerException e) {
            this.postTriggerEvent = null;
        }
    }

    @PrePersist
    public void buildStateMachine() {
        State initialState = new State();
        Transition transition = new Transition();
        transition.setTriggerCondition(this.triggerEvent);
        List<Transition> transitions = new ArrayList<>(1);
        transitions.add(transition);
        initialState.setTransitions(transitions);
        HashMap<Long, State> states = new HashMap<>();
        states.put(1L, initialState);
        if (this.oneShot != null && this.oneShot) {
            transition.setNextStateId(2L);
            State finalState = new State();
            finalState.setOnEnterEvent(this.postTriggerEvent);
            states.put(2L, finalState);
        } else {
            initialState.setOnEnterEvent(this.postTriggerEvent);
            transition.setNextStateId(1L);
        }
        ((TriggerInstance)this.getDefaultVariableInstance()).setCurrentStateId(1L);
        this.setStates(states);
    }

    @Override
    public String toString() {
        return "TriggerDescriptorEntity{id=" + this.getId() + ", oneShot=" + oneShot + ", triggerEvent=" + triggerEvent + ", postTriggerEvent=" + postTriggerEvent + '}';
    }
}
