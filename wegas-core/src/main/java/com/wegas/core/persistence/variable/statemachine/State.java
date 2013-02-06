/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.dialogue.ActiveResponse;
import com.wegas.core.rest.util.Views;
import com.wegas.leaderway.persistence.DialogueState;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "fsm_state")
@Access(AccessType.FIELD)
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "ActiveResponse", value = ActiveResponse.class),
    @JsonSubTypes.Type(name = "DialogueState", value = DialogueState.class)
})
public class State extends AbstractEntity {

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
    @Embedded
    /**
     *
     */
    private Script onEnterEvent;
    /**
     *
     */
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "transition_id", referencedColumnName = "state_id")
    private List<Transition> transitions = new ArrayList<>();
    private Coordinate editorPosition;

    /**
     *
     */
    public State() {
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
    public String toString() {
        return "State{" + "id=" + id + ", label=" + label + ", onEnterEvent=" + onEnterEvent + ", transitions=" + transitions + '}';
    }

    @Override
    public void merge(AbstractEntity other) {
        State newState = (State) other;
        this.label = newState.getLabel();
        this.onEnterEvent = newState.getOnEnterEvent();
        this.editorPosition = newState.editorPosition;
        this.transitions = ListUtils.mergeLists(this.transitions, newState.transitions);
    }
}
