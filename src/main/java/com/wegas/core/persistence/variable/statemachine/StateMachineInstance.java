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

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.dialogue.DialogueInstance;
import java.io.Serializable;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Transient;
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
//    @ElementCollection
    @Transient
    private List<Transition> transitionHistory;

    public StateMachineInstance() {
    }

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

    public List<Transition> getTransitionHistory() {
        return transitionHistory;
    }

    public void setTransitionHistory(List<Transition> transitionHistory) {
        this.transitionHistory = transitionHistory;
    }

    @Override
    public void merge(AbstractEntity a) {
        this.currentStateId = ((StateMachineInstance) a).getCurrentStateId();
    }

    @Override
    public String toString() {
        return "StateMachineInstance{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}
