/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

//import javax.xml.bind.annotation.XmlRootElement;
/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Access(AccessType.FIELD)
//@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DialogueTransition", value = DialogueTransition.class)
})
@Table(
        indexes = {
            @Index(columnList = "state_id")
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
    private Integer index = 0;

    /**
     *
     */
    private Long nextStateId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, cascade = {})
    @JoinColumn(name = "state_id", referencedColumnName = "state_id")
    private State state;

    /**
     *
     */
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "content", column
                = @Column(name = "onTransition_content")),
        @AttributeOverride(name = "lang", column
                = @Column(name = "onTransition_language"))
    })
    @JsonView(Views.EditorI.class)
    private Script preStateImpact;

    /**
     *
     */
    @Embedded
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
     * @return
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

    /**
     * @return
     */
    public Script getPreStateImpact() {
        return preStateImpact;
    }

    /**
     * @param preStateImpact
     */
    public void setPreStateImpact(Script preStateImpact) {
        this.preStateImpact = preStateImpact;
    }

    @Override
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        ret.add(this.triggerCondition);
        ret.add(this.preStateImpact);
        return ret;
    }

    /**
     * @return
     */
    public Script getTriggerCondition() {
        return triggerCondition;
    }

    /**
     * @param triggerCondition
     */
    public void setTriggerCondition(Script triggerCondition) {
        this.triggerCondition = triggerCondition;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Transition) {
            Transition newTranstion = (Transition) other;
            this.setVersion(newTranstion.getVersion());
            this.setNextStateId(newTranstion.getNextStateId());
            this.setPreStateImpact(newTranstion.getPreStateImpact());
            this.setTriggerCondition(newTranstion.getTriggerCondition());
            this.setIndex(newTranstion.getIndex());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    @Override
    public String toString() {
        return "Transition{" + "triggerCondition=" + triggerCondition + ", nextStateId=" + nextStateId + '}';
    }

    @Override
    public String getRequieredUpdatePermission() {
        return this.getState().getRequieredUpdatePermission();
    }

    @Override
    public String getRequieredReadPermission() {
        return this.getState().getRequieredReadPermission();
    }
}
