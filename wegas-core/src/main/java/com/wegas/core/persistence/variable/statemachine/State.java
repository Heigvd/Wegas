/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
//import javax.xml.bind.annotation.XmlRootElement;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.variable.Scripted;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "fsm_state")
@Access(AccessType.FIELD)
//@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DialogueState", value = DialogueState.class)
})
public class State extends AbstractEntity implements Searchable, Scripted {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @JsonView(value = Views.EditorExtendedI.class)
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
    private String label;
    /**
     *
     */
    @Embedded
    @JsonView(Views.EditorExtendedI.class)
    private Script onEnterEvent;
    /**
     *
     */
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "state_id", referencedColumnName = "state_id")
    @OrderBy("index")
    private List<Transition> transitions = new ArrayList<>();

    /**
     *
     */
    public State() {
    }

    @Override
    public Boolean contains(final String criteria) {
        return this.containsAll(new ArrayList<String>() {
            {
                add(criteria);
            }
        });
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
     *
     * @return
     */
    public Coordinate getEditorPosition() {
        return editorPosition;
    }

    /**
     *
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
     *
     * @return
     */
    public String getLabel() {
        return label;
    }

    /**
     *
     * @param label
     */
    public void setLabel(String label) {
        this.label = label;
    }

    /**
     *
     * @return
     */
    public Script getOnEnterEvent() {
        return onEnterEvent;
    }

    /**
     *
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
     *
     * @return
     */
    public List<Transition> getTransitions() {
        return transitions;
    }

    /**
     *
     * @param transitions
     */
    public void setTransitions(List<Transition> transitions) {
        this.transitions = transitions;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof State) {
            State newState = (State) other;
            this.label = newState.getLabel();
            this.onEnterEvent = newState.getOnEnterEvent();
            this.editorPosition = newState.editorPosition;
            this.transitions = ListUtils.mergeLists(this.transitions, newState.transitions);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    @Override
    public String toString() {
        return "State{" + "id=" + id + ", label=" + label + ", onEnterEvent=" + onEnterEvent + ", transitions=" + transitions + '}';
    }
}
