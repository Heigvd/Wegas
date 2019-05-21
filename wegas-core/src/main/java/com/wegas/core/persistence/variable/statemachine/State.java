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
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.Origin;
import com.wegas.editor.ValueGenerators.Zero;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.ADVANCED;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.ReadOnlyNumber;
import com.wegas.editor.View.ScriptView;
import com.wegas.editor.View.View;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import javax.persistence.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(
        name = "fsm_state",
        indexes = {
            @Index(columnList = "statemachine_id"),
            @Index(columnList = "text_id") // stands in superclass since index is not generated if defined in DialogueState ...
        }
)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DialogueState", value = DialogueState.class)
})
@JsonIgnoreProperties(value = {"stateMachineId"})
//@OptimisticLocking(cascade = true)
public class State extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    @ManyToOne
    @JsonIgnore
    private StateMachineDescriptor stateMachine;

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
    @JsonView(value = Views.EditorI.class)
    @WegasEntityProperty(
            nullable = false, optional = false, proposal = Origin.class,
            view = @View(label = "Graphical coordinates", featureLevel = ADVANCED))
    private Coordinate editorPosition;

    /**
     *
     */
    @Id
    @Column(name = "id")
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     *
     */
    @Column(name = "fsm_statekey")
    @WegasEntityProperty(view = @View(label = "Index", value = ReadOnlyNumber.class))
    private Long index;

    /**
     *
     */
    @WegasEntityProperty(searchable = true, view = @View(label = "Label"))
    private String label;

    /**
     *
     */
    @Embedded
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(view = @View(label = "On enter impact", value = ScriptView.Impact.class))
    private Script onEnterEvent;

    /**
     *
     */
    @OneToMany(mappedBy = "state", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Transitions", value = Hidden.class))
    private List<Transition> transitions = new ArrayList<>();

    /**
     *
     */
    public State() {
    }

    /**
     * Get the stateMachineDescriptor which defines this state
     *
     * @return this state's parent
     */
    public StateMachineDescriptor getStateMachine() {
        return stateMachine;
    }

    public void setStateMachine(StateMachineDescriptor stateMachine) {
        this.stateMachine = stateMachine;
    }

    /**
     * @return state position in the stateMachine editor extent
     */
    public Coordinate getEditorPosition() {
        return editorPosition;
    }

    /**
     * @param editorPosition
     */
    public void setEditorPosition(Coordinate editorPosition) {
        this.editorPosition = editorPosition;
    }

    @Override
    public Long getId() {
        return id;
    }

    @JsonProperty
    public Long getIndex() {
        return index;
    }

    @JsonIgnore
    public void setIndex(Long index) {
        this.index = index;
    }

    /**
     * @return state name
     */
    public String getLabel() {
        return label;
    }

    /**
     * @param label
     */
    public void setLabel(String label) {
        this.label = label;
    }

    /**
     * get the script which to execute when this state become the current state
     *
     * @return the script which to execute when this state become the current state
     */
    public Script getOnEnterEvent() {
        this.touchOnEnterEvent();
        return onEnterEvent;
    }

    private void touchOnEnterEvent() {
        if (this.onEnterEvent != null) {
            this.onEnterEvent.setParent(this, "impact");
        }
    }

    /**
     * @param onEnterEvent
     */
    public void setOnEnterEvent(Script onEnterEvent) {
        this.onEnterEvent = onEnterEvent;
        this.touchOnEnterEvent();
    }

    /**
     * @return unmodifiable list of transitions, sorted by index
     */
    @JsonIgnore
    public List<Transition> getSortedTransitions() {
        Collections.sort(this.transitions, new ComparatorImpl());
        return this.transitions;
    }

    /**
     * @return list of transition going out of the state
     */
    public List<Transition> getTransitions() {
        return transitions;
    }

    public Transition addTransition(Transition t) {
        List<Transition> ts = this.getTransitions();
        if (!ts.contains(t)) {
            ts.add(t);
        }
        this.setTransitions(ts);
        return t;
    }

    /**
     * @param transitions
     */
    public void setTransitions(List<Transition> transitions) {
        for (Transition t : transitions) {
            t.setState(this);
        }
        this.transitions = transitions;
    }

    @Override
    public String toString() {
        return "State{" + "id=" + id + ", v=" + version + ", label=" + label + ", onEnterEvent=" + onEnterEvent + ", transitions=" + transitions + '}';
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getStateMachine();
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getStateMachine().getEntities();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        Collection<WegasPermission> perms = this.getStateMachine().getRequieredUpdatePermission();
        // see issue #1441
        perms.add(this.getParentGameModel().getAssociatedTranslatePermission(""));
        return perms;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getStateMachine().getRequieredReadPermission();
    }

    /**
     * Compare transition by index
     */
    private static class ComparatorImpl implements Comparator<Transition>, Serializable {

        private static final long serialVersionUID = -6452488638539643500L;

        public ComparatorImpl() {
        }

        @Override
        public int compare(Transition t1, Transition t2) {
            return t1.getIndex() - t2.getIndex();
        }
    }
}
