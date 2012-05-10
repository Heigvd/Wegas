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
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
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
    @JsonSubTypes.Type(name = "TriggerInstance", value = TriggerInstanceEntity.class)
})
public class StateMachineInstanceEntity extends VariableInstanceEntity implements Serializable {

    @Column(name = "currentstate_id", nullable=false)
    private Long currentStateId;

    public StateMachineInstanceEntity() {
    }

    @XmlTransient
    public State getCurrentState() {
        return ((StateMachineDescriptorEntity) this.getDescriptor()).getStates().get(this.currentStateId);
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

    @Override
    public void merge(AbstractEntity a) {
        this.currentStateId = ((StateMachineInstanceEntity) a).getCurrentStateId();
    }

    @Override
    public String toString() {
        return "StateMachineInstanceEntity{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}