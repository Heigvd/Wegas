/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.INTERNAL;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.annotations.WegasConditions.Equals;
import com.wegas.core.persistence.annotations.WegasRefs;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyScript;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.Visible;
import com.wegas.editor.view.ArrayView;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.ManualOrAutoSelectView;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.ScriptView;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.AttributeOverride;
import javax.persistence.AttributeOverrides;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Version;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Access(AccessType.FIELD)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "Transition", value = Transition.class),
    @JsonSubTypes.Type(name = "DialogueTransition", value = DialogueTransition.class)
})
@Table(
    name = "transition",
    indexes = {
        @Index(columnList = "state_id"),
        @Index(columnList = "actiontext_id")
    }
)
@JsonIgnoreProperties({"stateId"})
public abstract class AbstractTransition extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    /**
     * Strategy to detect the variables this transition depends on
     */
    public enum DependsOnStrategy {
        /**
         * Default. Try to detect dependencies by parsing the script
         */
        AUTO,
        /**
         * Manual mode: list must be set by hand
         */
        MANUAL,
    };

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        sameEntityOnly = true, view = @View(
            label = "Version",
            readOnly = true,
            value = NumberView.class,
            featureLevel = ADVANCED
        )
    )
    private Long version;

    /**
     *
     */
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        view = @View(label = "Index", featureLevel = ADVANCED))
    private Integer index = 0;

    /**
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Next State", value = Hidden.class, featureLevel = INTERNAL))
    private Long nextStateId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, cascade = {})
    private AbstractState state;

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
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = EmptyScript.class,
        view = @View(label = "Impact", value = ScriptView.Impact.class))
    private Script preStateImpact;

    /**
     *
     */
    @Embedded
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = EmptyScript.class,
        view = @View(label = "Condition", value = ScriptView.Condition.class))
    private Script triggerCondition;

    /**
     * DependsOn strategy
     */
    @WegasEntityProperty(
        nullable = false,
        view = @View(
            label = "Depends on strategy",
            value = ManualOrAutoSelectView.class,
            index = -300
        ))
    @Column(length = 10, columnDefinition = "character varying(10) default 'LIVE'::character varying")
    @Enumerated(value = EnumType.STRING)
    private DependsOnStrategy dependsOnStrategy = DependsOnStrategy.AUTO;

    /**
     * List of variable the condition depends on. Empty means the condition MUST be evaluated in all
     * cases.
     */
    @OneToMany(mappedBy = "transition", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @WegasEntityProperty(
        optional = false, nullable = false,
        proposal = EmptyArray.class,
        view = @View(label = "Depends on", value = ArrayView.Highlight.class)
    )
    @Visible(IsManual.class)
    private Set<TransitionDependency> dependencies = new HashSet<>();

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

    public AbstractState getState() {
        return state;
    }

    public void setState(AbstractState state) {
        this.state = state;
    }

    @JsonView(Views.IndexI.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @WegasExtraProperty(view = @View(value = Hidden.class, label = ""))
    public Long getStateMachineId() {
        return this.getState().getStateMachineId();
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

    /**
     * get dependsOn strategy
     *
     * @return manual or auto ?
     */
    public DependsOnStrategy getDependsOnStrategy() {
        return dependsOnStrategy;
    }

    /**
     * Set dependsOn strategy
     *
     * @param dependsOnStrategy the new strategy
     */
    public void setDependsOnStrategy(DependsOnStrategy dependsOnStrategy) {
        this.dependsOnStrategy = dependsOnStrategy;
    }

    /**
     * get all dependencies
     *
     * @return list of deps
     */
    public Set<TransitionDependency> getDependencies() {
        return dependencies;
    }

    /**
     * Set list of dependencies
     *
     * @param dependencies lsit of dependencies
     */
    public void setDependencies(Set<TransitionDependency> dependencies) {
        this.dependencies = dependencies;
        if (this.dependencies != null) {
            for (var dep : this.dependencies) {
                dep.setTransition(this);
                dep.registerInVariable();
            }
        }
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
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
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getState().getEntities();
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

    /**
     * Form condition to toggle display of conditions
     */
    public static class IsManual extends Equals {

        public IsManual() {
            super(
                new WegasRefs.Field(null, "dependsOnStrategy"),
                new WegasRefs.Const(DependsOnStrategy.MANUAL)
            );
        }
    }

}
