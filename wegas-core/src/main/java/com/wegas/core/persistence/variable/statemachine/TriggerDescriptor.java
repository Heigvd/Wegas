/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition.DependsOnStrategy;
import com.wegas.core.persistence.variable.statemachine.AbstractTransition.IsManual;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyScript;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.ValueGenerators.True;
import com.wegas.editor.Visible;
import com.wegas.editor.view.ArrayView;
import com.wegas.editor.view.ManualOrAutoSelectView;
import com.wegas.editor.view.ScriptView;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Transient;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@WegasEntity(
    ignoreProperties = {"states"}, // no not merge states inherited from StateMachineDescriptor
    callback = TriggerDescriptor.MergeTriggerHack.class // but ensure they exist one all transient fields have been set
)
@JsonIgnoreProperties(value = {"states"})
public class TriggerDescriptor extends AbstractStateMachineDescriptor<TriggerState, Transition> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = False.class,
        view = @View(
            index = 601,
            label = "Only once",
            description = "Allowed to trigger only once"
        ))
    private Boolean oneShot = false;

    /**
     *
     */
    @JsonView(Views.EditorI.class)
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = True.class,
        view = @View(
            index = 601,
            label = "Disable itself",
            description = "Disable once triggered. May be rearmed afterwards"
        ))
    private Boolean disableSelf = true;

    /**
     * DependsOn strategy
     */
    @Transient
    @WegasEntityProperty(
        nullable = false,
        view = @View(
            label = "Depends on strategy",
            value = ManualOrAutoSelectView.class,
            index = 602
        ))
    private DependsOnStrategy dependsOnStrategy;

    /**
     * List of variable the condition depends on. Empty means the condition MUST be evaluated in all
     * case
     */
    @Transient
    @WegasEntityProperty(
        optional = false, nullable = false,
        proposal = EmptyArray.class,
        view = @View(label = "Depends on", value = ArrayView.Highlight.class)
    )
    @Visible(IsManual.class)
    private Set<TransitionDependency> dependencies;

    /**
     *
     */
    @Transient
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = EmptyScript.class,
        view = @View(
            index = 603,
            label = "Condition(s)",
            value = ScriptView.Condition.class
        ))
    private Script triggerEvent;
    /**
     *
     */
    @Transient
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = EmptyScript.class,
        view = @View(
            index = 604,
            label = "Impact(s)",
            value = ScriptView.Impact.class
        ))
    private Script postTriggerEvent;

    /**
     * is the trigger designed to trigger only once ?
     *
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
        //this.buildStateMachine();
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
        if (this.postTriggerEvent == null) {
            if (this.getStates() != null && this.getStates().size() > 0) {
                if (this.getStates().size() == 2) {
                    this.postTriggerEvent = this.getStates().get(2L).getOnEnterEvent();
                } else {
                    // Backward !!!
                    this.postTriggerEvent = this.getStates().get(1L).getOnEnterEvent();
                }
            } else {
                this.postTriggerEvent = null;
            }
        }
        this.touchPostTriggerEvent();
        return postTriggerEvent;
    }

    private void touchTriggerEvent() {
        if (this.triggerEvent != null) {
            this.triggerEvent.setParent(this, "condition");
        }
    }

    private void touchPostTriggerEvent() {
        if (this.postTriggerEvent != null) {
            this.postTriggerEvent.setParent(this, "impact");
        }
    }

    /**
     * Sets the event executed once the trigger fires.
     *
     * @param postTriggerEvent a script to execute after this trigger executes
     */
    public void setPostTriggerEvent(Script postTriggerEvent) {
        this.postTriggerEvent = postTriggerEvent;
        touchPostTriggerEvent();
        //this.buildStateMachine();
    }

    /**
     * get dependsOn strategy
     *
     * @return manual or auto ?
     */
    public DependsOnStrategy getDependsOnStrategy() {
        if (this.dependsOnStrategy == null) {
            Transition t = this.getTransition();
            if (t != null) {
                return t.getDependsOnStrategy();
            }
        }
        return this.dependsOnStrategy;
    }

    /**
     * Set dependsOn strategy
     *
     * @param dependsOnStrategy the new strategy
     */
    public void setDependsOnStrategy(DependsOnStrategy dependsOnStrategy) {
        this.dependsOnStrategy = dependsOnStrategy;
    }

    private Transition getTransition() {
        if (this.getStates() != null && this.getStates().size() > 0
            && this.getStates().get(1L).getInternalTransitions() != null
            && this.getStates().get(1L).getInternalTransitions().size() > 0) {
            return this.getStates().get(1L).getInternalTransitions().get(0);
        } else {
            return null;
        }
    }

    /**
     * Trigger condition
     *
     * @return condition for trigger to triggers
     */
    public Script getTriggerEvent() {
        if (this.triggerEvent == null) {
            Transition t = this.getTransition();
            if (t != null) {
                this.triggerEvent = t.getTriggerCondition();
            } else {
                this.triggerEvent = null;
            }
        }
        this.touchTriggerEvent();
        return triggerEvent;
    }

    /**
     * get all dependencies
     *
     * @return list of deps
     */
    public Set<TransitionDependency> getDependencies() {
        if (this.dependencies == null) {
            Transition t = this.getTransition();
            if (t != null) {
                if (t.getDependencies() != null) {
                    return t.getDependencies();
                }
            }
            // do never return null
            return new HashSet<>();
        } else {
            return this.dependencies;
        }
    }

    /**
     * Set list of dependencies
     *
     * @param dependencies lsit of dependencies
     */
    public void setDependencies(Set<TransitionDependency> dependencies) {
        this.dependencies = dependencies;
    }

    /**
     * Sets the script which fires the trigger.
     *
     * @param triggerEvent a script which fires the trigger
     */
    public void setTriggerEvent(Script triggerEvent) {
        this.triggerEvent = triggerEvent;
        this.touchTriggerEvent();
        //this.buildStateMachine();
    }

    /**
     *
     */
    @PrePersist // to be called by forthcoming revive method (replace PrePersist and merge usage)
    public void buildStateMachine() {
        if (this.getStates().size() < 2 || this.getStates().get(2L).getInternalTransitions().isEmpty()) {
            // make sure both initial and final states exists
            TriggerState initial;
            TriggerState finalState;
            if (this.getStates().isEmpty()) {
                initial = new TriggerState();
                initial.setVersion(1L);
                this.addState(1L, initial);
            } else {
                initial = this.getStates().get(1L);
            }

            if (this.getStates().size() < 2) {
                // Create the second one
                finalState = new TriggerState();
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
            if (initial.getInternalTransitions().isEmpty()) {
                transition = new Transition();
                initial.addTransition(transition);
            } else {
                transition = initial.getInternalTransitions().get(0);
            }
            // Make sure transition go to state 2
            transition.setNextStateId(2L);

            // Make sure reset transition exists
            if (finalState.getInternalTransitions().isEmpty()) {
                Transition reset = new Transition();
                reset.setNextStateId(1L);
                List<Transition> transitions = new ArrayList<>(1);
                transitions.add(reset);
                finalState.setTransitions(transitions);
            }
        }

        // Condition
        if (this.triggerEvent != null) {
            this.getStates().get(1L).getInternalTransitions().get(0).setTriggerCondition(this.triggerEvent);
            this.triggerEvent = null;
        }

        Transition transition = this.getStates().get(1L).getInternalTransitions().get(0);
        transition.setDependsOnStrategy(this.dependsOnStrategy == null ? DependsOnStrategy.AUTO : this.dependsOnStrategy);
        transition.setDependencies(this.dependencies == null ? new HashSet() : this.dependencies);
        this.dependsOnStrategy = null;
        this.dependencies = null;

        // Impact
        if (this.postTriggerEvent != null) {
            this.getStates().get(2L).setOnEnterEvent(this.postTriggerEvent);
            this.postTriggerEvent = null;
        }

        // Reset transition
        if (this.oneShot != null) {
            this.getStates().get(2L).getInternalTransitions().get(0).setTriggerCondition(new Script("javascript", (this.oneShot ? "false" : "true")));
        }

        this.getDefaultInstance().setCurrentStateId(1l);
    }

    @Override
    public String toString() {
        return "TriggerDescriptor{id=" + this.getId() + ", oneShot=" + oneShot + ", triggerEvent=" + triggerEvent + ", postTriggerEvent=" + postTriggerEvent + ", states: " + this.getStates().size() + '}';
    }

    public static class MergeTriggerHack implements WegasCallback {

        @Override
        public void postUpdate(IMergeable entity, Object ref, Object identifier) {
            if (entity instanceof TriggerDescriptor) {
                TriggerDescriptor td = (TriggerDescriptor) entity;
                td.buildStateMachine();
            }
        }
    }
}
