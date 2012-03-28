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

import java.io.Serializable;
import java.util.Map;
import javax.persistence.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name="state_machine")
public class FiniteStateMachine implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    @ElementCollection
    @CollectionTable(name = "state")
    @MapKeyColumn(name = "state_id")
    private Map<Integer, State> states;
    private Integer currentStateId;
    private Integer defaultState;

    public FiniteStateMachine() {
    }

    public Integer getCurrentStateId() {
        return currentStateId;
    }

    public void setCurrentStateId(Integer currentStateId) {
        this.currentStateId = currentStateId;
    }

    public Integer getDefaultState() {
        return defaultState;
    }

    public void setDefaultState(Integer defaultState) {
        this.defaultState = defaultState;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Map<Integer, State> getStates() {
        return states;
    }

    public void setStates(Map<Integer, State> states) {
        this.states = states;
    }
}
