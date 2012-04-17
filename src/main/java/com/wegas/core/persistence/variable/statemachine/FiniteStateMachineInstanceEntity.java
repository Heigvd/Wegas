/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.io.Serializable;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "state_machine")
@XmlRootElement
@XmlType(name = "FSMInstance")
public class FiniteStateMachineInstanceEntity extends VariableInstanceEntity implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    private Integer currentStateId;

    public FiniteStateMachineInstanceEntity() {
    }

    public Integer getCurrentStateId() {
        return currentStateId;
    }

    public void setCurrentStateId(Integer currentStateId) {
        this.currentStateId = currentStateId;
    }

    @Override
    public void merge(AbstractEntity a) {
        FiniteStateMachineInstanceEntity mergeFSM = (FiniteStateMachineInstanceEntity) a;
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public String toString() {
        return "FiniteStateMachineInstanceEntity{" + "id=" + id + ", currentStateId=" + currentStateId + '}';
    }

    @PrePersist
    public void generateInitialState() {
        this.currentStateId = ((FiniteStateMachineDescriptorEntity) this.getScope().getVariableDescriptor()).getInitialStateId();
    }
}
