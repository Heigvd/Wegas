/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
//import javax.xml.bind.annotation.XmlRootElement;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.EntityComparators;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(name = "FSMinstance"/*, 
        indexes = {
            @Index(columnList = "transitionHistory.statemachineinstance_variableinstance_id")
        }*/
)
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@Access(AccessType.FIELD)
//@XmlRootElement
//@XmlType(name = "FSMInstance")
@JsonTypeName(value = "FSMInstance")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "TriggerInstance", value = TriggerInstance.class)
})
public class StateMachineInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Column(name = "currentstate_id")
    private Long currentStateId;
    /**
     *
     */
    private Boolean enabled = true;
    /**
     *
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "transitionHistory")
    @JsonIgnore
    private List<TransitionHistoryEntry> transitionHistory = new ArrayList<>();

    /**
     *
     */
    public StateMachineInstance() {
    }

    /**
     *
     * @return
     */
    @JsonProperty("currentState")
    public State getCurrentState() {
        final Map<Long, State> states = ((StateMachineDescriptor) this.findDescriptor()).getStates();
        return states.get(this.currentStateId);
    }

    /**
     *
     * @param state
     */
    @JsonIgnore
    public void setCurrentState(State state) {
        //Not meant to be used
    }

    /**
     * @return the currentStateId
     */
    public Long getCurrentStateId() {
        return currentStateId;
    }

    /**
     * @param currentStateId the currentStateId to set
     */
    public void setCurrentStateId(Long currentStateId) {
        this.currentStateId = currentStateId;
    }

    /**
     *
     * @return
     */
    public Boolean getEnabled() {
        return enabled;
    }

    /**
     *
     * @param enabled
     */
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    /**
     *
     * @return
     */
    @JsonProperty
    public List<Long> getTransitionHistory() {
        List<TransitionHistoryEntry> copy = Helper.copyAndSort(this.transitionHistory, new EntityComparators.OrderComparator<>());

        List<Long> h = new ArrayList<>();
        for (TransitionHistoryEntry entry : copy) {
            h.add(entry.getTansitionId());
        }
        return h;
    }

    @JsonProperty
    public void setTransitionHistory(List<Long> transitionHistory) {
        this.transitionHistory.clear();
        if (transitionHistory != null) {
            for (int i = 0; i < transitionHistory.size(); i++) {
                this.transitionHistory.add(new TransitionHistoryEntry(transitionHistory.get(i), i));
            }
        }
    }

    /**
     *
     * @param id
     */
    public void transitionHistoryAdd(Long id) {
        List<Long> h = this.getTransitionHistory();
        h.add(id);
        this.setTransitionHistory(h);
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof StateMachineInstance) {
            StateMachineInstance other = (StateMachineInstance) a;
            super.merge(a);
            this.setCurrentStateId(other.getCurrentStateId());
            this.setEnabled(other.getEnabled());
            this.setTransitionHistory(new ArrayList<>());
            this.getTransitionHistory().addAll(other.getTransitionHistory());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    @Override
    public String toString() {
        return "StateMachineInstance{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}
