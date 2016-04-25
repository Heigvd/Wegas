/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlRootElement;
////import javax.xml.bind.annotation.XmlTransient;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
//@XmlRootElement
//@XmlType(name = "TriggerDescriptor")
public class TriggerDescriptor extends StateMachineDescriptor {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @JsonView(Views.EditorExtendedI.class)
    private Boolean oneShot = false;

    /**
     *
     */
    @JsonView(Views.EditorExtendedI.class)
    private Boolean disableSelf = true;
    /**
     *
     */
    @Transient
    @JsonView(Views.EditorExtendedI.class)
    private Script triggerEvent;
    /**
     *
     */
    @Transient
    @JsonView(Views.EditorExtendedI.class)
    private Script postTriggerEvent;

    /**
     *
     */
    public TriggerDescriptor() {
    }

    /**
     *
     * @return
     */
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

    public Boolean isDisableSelf() {
        return disableSelf;
    }

    public void setDisableSelf(Boolean disableSelf) {
        this.disableSelf = disableSelf;
    }

    /**
     *
     * @return
     */
    public Script getPostTriggerEvent() {
        try {
            if (this.oneShot) {
                this.postTriggerEvent = this.getStates().get(2L).getOnEnterEvent();
            } else {
                this.postTriggerEvent = this.getStates().get(1L).getOnEnterEvent();
            }
        } catch (NullPointerException e) {
            this.postTriggerEvent = null;
        }
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

    /**
     *
     * @return
     */
    public Script getTriggerEvent() {

        try {
            this.triggerEvent = this.getStates().get(1L).getTransitions().get(0).getTriggerCondition();
        } catch (NullPointerException e) {
            this.triggerEvent = null;
        }
        return triggerEvent;
    }

    /**
     * Override to make this function transient
     *
     * @return
     * @see StateMachineDescriptor#getStates
     */
    @Override
    //@XmlTransient
    @JsonIgnore
    public Map<Long, State> getStates() {
        return super.getStates();
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
        if (a instanceof TriggerDescriptor) {
            TriggerDescriptor entity = (TriggerDescriptor) a;
            entity.buildStateMachine();
            this.setOneShot(entity.isOneShot());
            this.setDisableSelf(entity.isDisableSelf());
            this.setPostTriggerEvent(entity.getPostTriggerEvent());
            this.setTriggerEvent(entity.getTriggerEvent());
            super.merge(entity);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     */
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
        this.getDefaultInstance().setCurrentStateId(1L);
        this.setStates(states);
    }

    @Override
    public String toString() {
        return "TriggerDescriptor{id=" + this.getId() + ", oneShot=" + oneShot + ", triggerEvent=" + triggerEvent + ", postTriggerEvent=" + postTriggerEvent + '}';
    }
}
