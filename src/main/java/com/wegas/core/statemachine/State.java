/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.statemachine;

import java.io.Serializable;
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
    private String onEnterEvent;
    @ElementCollection
    @CollectionTable(name = "transition")
    @Embedded
    private List<Transition> transitions;

    public State() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOnEnterEvent() {
        return onEnterEvent;
    }

    public void setOnEnterEvent(String onEnterEvent) {
        this.onEnterEvent = onEnterEvent;
    }

    public List<Transition> getTransitions() {
        return transitions;
    }

    public void setTransitions(List<Transition> transitions) {
        this.transitions = transitions;
    }
    
    
}
