/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.script.ScriptEntity;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "fsm_state")
@Access(AccessType.FIELD)
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class State implements Serializable {

    @Id
    @Column(name = "state_id")
    @GeneratedValue
    private Long id;
    private String label;
    @Embedded
    private ScriptEntity onEnterEvent;
    @ElementCollection(fetch = FetchType.EAGER)
    @Embedded
    private List<Transition> transitions = new ArrayList<>();

    public State() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public ScriptEntity getOnEnterEvent() {
        return onEnterEvent;
    }

    public void setOnEnterEvent(ScriptEntity onEnterEvent) {
        this.onEnterEvent = onEnterEvent;
    }

    public List<Transition> getTransitions() {
        return transitions;
    }

    public void setTransitions(List<Transition> transitions) {
        this.transitions = transitions;
    }

    @Override
    public String toString() {
        return "State{" + "id=" + id + ", label=" + label + ", onEnterEvent=" + onEnterEvent + ", transitions=" + transitions + '}';
    }

    public void merge(State newState) {
        this.label = newState.getLabel();
        this.onEnterEvent = newState.getOnEnterEvent();
        this.transitions = newState.getTransitions();
    }
}
