/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.Zero;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.ADVANCED;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.INTERNAL;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.ReadOnlyNumber;
import com.wegas.editor.View.ScriptView;
import com.wegas.editor.View.View;
import java.util.Collection;
import javax.persistence.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Access(AccessType.FIELD)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DialogueTransition", value = DialogueTransition.class)
})
@Table(
        indexes = {
            @Index(columnList = "state_id"),
            @Index(columnList = "actiontext_id")
        }
)
@JsonIgnoreProperties({"stateId"})
public class Transition extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(nullable = false, optional = false, proposal = Zero.class,
            sameEntityOnly = true, view = @View(label = "Version", value = ReadOnlyNumber.class, featureLevel = ADVANCED))
    private Long version;

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    /**
     *
     */
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(view = @View(label = "Index", featureLevel = ADVANCED))
    private Integer index = 0;

    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Next State", value = Hidden.class, featureLevel = INTERNAL))
    private Long nextStateId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, cascade = {})
    private State state;

    /**
     *
     */
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "content", column
                = @Column(name = "onTransition_content")),
        @AttributeOverride(name = "language", column
                = @Column(name = "onTransition_language"))
    })
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(view = @View(label = "Impact", value = ScriptView.Impact.class))
    private Script preStateImpact;

    /**
     *
     */
    @Embedded
    @WegasEntityProperty(view = @View(label = "Condition", value = ScriptView.Condition.class))
    private Script triggerCondition;

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return the index
     */
    public Integer getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(Integer index) {
        this.index = index;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    @JsonView(Views.IndexI.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public Long getStateMachineId() {
        return this.getState().getStateMachine().getId();
    }

    /**
     * @return index of state the transition is pointing to
     */
    public Long getNextStateId() {
        return nextStateId;
    }

    /**
     * @param nextStateId
     */
    public void setNextStateId(Long nextStateId) {
        this.nextStateId = nextStateId;
    }

    private void touchPreStateImpact() {
        if (this.preStateImpact != null) {
            this.preStateImpact.setParent(this, "impact");
        }
    }

    /**
     * @return script to execute on transition
     */
    public Script getPreStateImpact() {
        this.touchPreStateImpact();
        return preStateImpact;
    }

    /**
     * @param preStateImpact
     */
    public void setPreStateImpact(Script preStateImpact) {
        this.preStateImpact = preStateImpact;
        this.touchPreStateImpact();
    }

    private void touchTriggerCondition() {
        if (this.triggerCondition != null) {
            this.triggerCondition.setParent(this, "condition");
        }
    }

    /**
     * @return script to execute to know if the transition is walkable
     */
    public Script getTriggerCondition() {
        this.touchTriggerCondition();
        return triggerCondition;
    }

    /**
     * @param triggerCondition
     */
    public void setTriggerCondition(Script triggerCondition) {
        this.triggerCondition = triggerCondition;
        this.touchTriggerCondition();
    }

    @Override
    public String toString() {
        return "Transition{" + "triggerCondition=" + triggerCondition + ", nextStateId=" + nextStateId + '}';
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getState();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        // same as the state (including the translator right) see issue #1441
        return this.getState().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getState().getRequieredReadPermission();
    }
}
