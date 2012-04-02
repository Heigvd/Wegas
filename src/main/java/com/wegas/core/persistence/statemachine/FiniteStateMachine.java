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
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "state_machine")
public class FiniteStateMachine implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    private String label;
    @ElementCollection
    @CollectionTable(name = "state")
    @MapKeyColumn(name = "state_id")
    private Map<Integer, State> states = new HashMap<>();
    private Integer currentStateId;
    private Integer defaultStateId;

    public FiniteStateMachine() {
    }

    public Integer getCurrentStateId() {
        return currentStateId;
    }

    public void setCurrentStateId(Integer currentStateId) {
        this.currentStateId = currentStateId;
    }

    public Integer getDefaultStateId() {
        return defaultStateId;
    }

    public void setDefaultStateId(Integer defaultState) {
        this.defaultStateId = defaultState;
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

    public Map<Integer, State> getStates() {
        return states;
    }

    public void setStates(HashMap<Integer, State> states) {
        this.states = states;
    }
}
