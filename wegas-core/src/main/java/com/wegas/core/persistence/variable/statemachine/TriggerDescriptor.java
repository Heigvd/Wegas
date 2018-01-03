/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;

import javax.persistence.Entity;
import javax.persistence.Transient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.persistence.Column;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
public class TriggerDescriptor extends StateMachineDescriptor {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @JsonView(Views.EditorI.class)
    private Boolean oneShot = false;

    /**
     *
     */
    @JsonView(Views.EditorI.class)
    @Column(columnDefinition = "boolean default false")
    private Boolean disableSelf = true;
    /**
     *
     */
    @Transient
    @JsonView(Views.EditorI.class)
    private Script triggerEvent;
    /**
     *
     */
    @Transient
    @JsonView(Views.EditorI.class)
    private Script postTriggerEvent;

    /**
     *
     */
    public TriggerDescriptor() {
    }

    /**
     * is the trigger designed to trigger only once ?
     * @return true if the trigger is designed to be trigged only once
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
        this.buildStateMachine();
    }

    public Boolean isDisableSelf() {
        return disableSelf;
    }

    public void setDisableSelf(Boolean disableSelf) {
        this.disableSelf = disableSelf;
    }

    /**
     * @return the script to execute when trigger triggers
     */
    public Script getPostTriggerEvent() {
        try {
            if (this.getStates().size() == 2) {
                this.postTriggerEvent = this.getStates().get(2L).getOnEnterEvent();
            } else {
                // Backward !!!
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
        this.buildStateMachine();
    }

    /**
     * Trigger condition
     *
     * @return condition for trigger to triggers
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
     * @return underlysing statemachine states
     * @see StateMachineDescriptor#getStates
     */
    @Override
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
        this.buildStateMachine();
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof TriggerDescriptor) {
            TriggerDescriptor entity = (TriggerDescriptor) a;

            this.setOneShot(entity.oneShot);
            this.setDisableSelf(entity.disableSelf);
            this.setPostTriggerEvent(entity.postTriggerEvent);
            this.setTriggerEvent(entity.triggerEvent);

            // HACK Restore Version Number
            //Long initialStateVersion = this.getStates().get(1L).getVersion();
            //Long finalStateVersion = this.getStates().get(2L).getVersion();

            entity.setStates(this.getStates());
            super.merge(entity);

            entity.buildStateMachine();
            //this.getStates().get(1L).setVersion(initialStateVersion);
            //this.getStates().get(2L).setVersion(finalStateVersion);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     */
    public void buildStateMachine() {
        if (this.getStates().size() < 2 || this.getStates().get(2L).getTransitions().isEmpty()) {

            // make sure both initial and final states exists
            State initial;
            State finalState;
            if (this.getStates().isEmpty()) {
                initial = new State();
                initial.setVersion(1L);
                this.addState(1L, initial);
            } else {
                initial = this.getStates().get(1L);
            }

            if (this.getStates().size() < 2) {
                // Create the second one
                finalState = new State();
                finalState.setVersion(1L);
                this.addState(2L, finalState);

                // Move impact
                finalState.setOnEnterEvent(initial.getOnEnterEvent());
                initial.setOnEnterEvent(null);
            } else {
                finalState = this.getStates().get(2L);
            }

            // Make sure transition exists
            Transition transition;
            if (initial.getTransitions().isEmpty()) {
                transition = new Transition();
                initial.addTransition(transition);
            } else {
                transition = initial.getTransitions().get(0);
            }
            // Make sure transition go to state 2
            transition.setNextStateId(2L);

            // Make sure reset transition exists
            if (finalState.getTransitions().isEmpty()) {
                Transition reset = new Transition();
                reset.setNextStateId(1L);
                List<Transition> transitions = new ArrayList<>(1);
                transitions.add(reset);
                finalState.setTransitions(transitions);
            }
        }

        // Condition
        this.getStates().get(1L).getTransitions().get(0).setTriggerCondition(this.triggerEvent);

        // Impact
        this.getStates().get(2L).setOnEnterEvent(this.postTriggerEvent);

        // Reset transition
        this.getStates().get(2L).getTransitions().get(0).setTriggerCondition(new Script("javascript", (this.oneShot ? "false" : "true")));
    }

    @Override
    public String toString() {
        return "TriggerDescriptor{id=" + this.getId() + ", oneShot=" + oneShot + ", triggerEvent=" + triggerEvent + ", postTriggerEvent=" + postTriggerEvent + '}';
    }
}
