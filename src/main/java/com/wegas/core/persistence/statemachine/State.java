/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.statemachine;

import com.wegas.core.script.ScriptEntity;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "fsm_state")
@Access(AccessType.FIELD)
public class State implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    private String label;
    @Embedded
    private ScriptEntity onEnterEvent;
    @ElementCollection
    @CollectionTable(name = "transition")
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
}
