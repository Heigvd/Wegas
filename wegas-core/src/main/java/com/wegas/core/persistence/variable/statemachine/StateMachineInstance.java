/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.dialogue.DialogueInstance;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "FSMinstance")
@XmlRootElement
@XmlType(name = "FSMInstance")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "TriggerInstance", value = TriggerInstance.class),
    @JsonSubTypes.Type(name = "DialogueInstance", value = DialogueInstance.class)
})
public class StateMachineInstance extends VariableInstance implements Serializable {

    @Column(name = "currentstate_id")
    private Long currentStateId;
    private Boolean enabled = true;
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "transitionHistory")
    @Column(name = "transitionId")
    private List<Long> transitionHistory = new ArrayList<>();

    /**
     *
     */
    public StateMachineInstance() {
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public State getCurrentState() {
        return ((StateMachineDescriptor) this.getDescriptor()).getStates().get(this.currentStateId);
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
    public List<Long> getTransitionHistory() {
        return transitionHistory;
    }

//    public void setTransitionHistory(List<Long> transitionHistory) {
//        this.transitionHistory = transitionHistory;
//    }
    /**
     *
     * @param id
     */
    public void transitionHistoryAdd(Long id) {
        this.transitionHistory.add(id);
    }

    @Override
    public void merge(AbstractEntity a) {
        this.currentStateId = ((StateMachineInstance) a).getCurrentStateId();
        this.enabled = ((StateMachineInstance) a).getEnabled();
        this.transitionHistory = ((StateMachineInstance) a).getTransitionHistory();
    }

    @Override
    public String toString() {
        return "StateMachineInstance{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}
