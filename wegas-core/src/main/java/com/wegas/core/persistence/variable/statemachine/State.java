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
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.Scripted;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

//import javax.xml.bind.annotation.XmlRootElement;
/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(
        name = "fsm_state",
        indexes = {
            @Index(columnList = "statemachine_id")
        }
)
//@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DialogueState", value = DialogueState.class)
})

//@OptimisticLocking(cascade = true)
public class State extends AbstractEntity implements Searchable, Scripted {

    private static final long serialVersionUID = 1L;

    @ManyToOne
    @JoinColumn(name = "statemachine_id")
    @JsonIgnore
    private StateMachineDescriptor stateMachine;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty
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
    @WegasEntityProperty
    private Coordinate editorPosition;

    /**
     *
     */
    @Id
    @Column(name = "state_id")
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     *
     */
    @WegasEntityProperty
    private String label;

    /**
     *
     */
    @Embedded
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty
    private Script onEnterEvent;

    /**
     *
     */
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "state_id", referencedColumnName = "state_id")
    @WegasEntityProperty(propertyType = WegasEntityProperty.PropertyType.CHILDREN)
    private List<Transition> transitions = new ArrayList<>();

    /**
     *
     */
    public State() {
    }

    public StateMachineDescriptor getStateMachine() {
        return stateMachine;
    }

    public void setStateMachine(StateMachineDescriptor stateMachine) {
        this.stateMachine = stateMachine;
    }

    public Long getStateMachineId() {
        return getStateMachine().getId();
    }

    public void setStateMachineId(Long stateMachineId) {
        //this.stateMachine = stateMachine;
    }

    @Override
    public Boolean containsAll(final List<String> criterias) {
        if (Helper.insensitiveContainsAll(this.getLabel(), criterias)) {
            return true;
        }
        if (this.getOnEnterEvent() != null && this.getOnEnterEvent().containsAll(criterias)) {
            return true;
        }
        for (Transition t : this.getTransitions()) {
            if (t.containsAll(criterias)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @return
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

    /**
     * @return
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
     * @return
     */
    public Script getOnEnterEvent() {
        return onEnterEvent;
    }

    /**
     * @param onEnterEvent
     */
    public void setOnEnterEvent(Script onEnterEvent) {
        this.onEnterEvent = onEnterEvent;
    }

    @Override
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        ret.add(this.onEnterEvent);
        for (Transition transition : this.getTransitions()) {
            ret.addAll(transition.getScripts());
        }
        return ret;
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
     * @return
     */
    public List<Transition> getTransitions() {
        return transitions;
    }

    public Transition addTransition(Transition t) {
        List<Transition> ts = this.getTransitions();
        ts.add(t);
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
    public void __merge(AbstractEntity other) {
    }

    @Override
    public String toString() {
        return "State{" + "id=" + id + ", v=" + version + ", label=" + label + ", onEnterEvent=" + onEnterEvent + ", transitions=" + transitions + '}';
    }

    /**
     * Compare transition by index
     */
    private static class ComparatorImpl implements Comparator<Transition> {

        public ComparatorImpl() {
        }

        @Override
        public int compare(Transition t1, Transition t2) {
            return t1.getIndex() - t2.getIndex();
        }
    }
}
