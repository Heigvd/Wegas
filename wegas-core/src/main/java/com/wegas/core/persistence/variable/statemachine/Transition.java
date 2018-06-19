/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
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
public class Transition extends AbstractEntity implements Searchable, Scripted {

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
    @WegasEntityProperty(sameEntityOnly = true)
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
    @WegasEntityProperty
    private Integer index = 0;

    /**
     *
     */
    @WegasEntityProperty
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
    @WegasEntityProperty
    private Script preStateImpact;

    /**
     *
     */
    @Embedded
    @WegasEntityProperty
    private Script triggerCondition;

    @Override
    public Boolean containsAll(final List<String> criterias) {
        if (this.getPreStateImpact() != null && this.getPreStateImpact().containsAll(criterias)) {
            return true;
        }
        return this.getTriggerCondition() != null && this.getTriggerCondition().containsAll(criterias);
    }

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

    public Long getStateId() {
        return this.getState().getId();
    }

    public void setStateId(Long id) {
    }

    public Long getStateMachineId() {
        return this.getState().getStateMachineId();
    }

    public void setStateMachineId(Long id) {
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


    private void touchPreStateImpact(){
        if (this.preStateImpact !=null){
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

    @Override
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        ret.add(this.triggerCondition);
        ret.add(this.preStateImpact);
        return ret;
    }

    private void touchTriggerCondition(){
        if (this.triggerCondition !=null){
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
        return this.getState().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getState().getRequieredReadPermission();
    }
}
