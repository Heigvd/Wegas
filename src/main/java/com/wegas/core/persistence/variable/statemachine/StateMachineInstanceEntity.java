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
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.io.Serializable;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.eclipse.persistence.oxm.annotations.XmlInverseReference;

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

    @Column(name = "currentstate_id", nullable = true, insertable = true, updatable = true)
    private Long currentStateId;
    /**
     * The game model this belongs to
     */
//    @ManyToOne
//    @NotNull
//    @XmlTransient
//    @XmlInverseReference(mappedBy = "teams")
//    @JoinColumn(name = "parentgame_id")
//    @JsonBackReference(value = "game-team")
//    private GameEntity game;
    @OneToOne(cascade = CascadeType.ALL)
    @XmlTransient
    @JoinColumn(name = "currentstate_id", insertable = false, updatable = false)
    private State currentState;

    public StateMachineInstanceEntity() {
    }

    @XmlTransient
    public State getCurrentState() {
        return currentState;
    }

    @XmlTransient
    public void setCurrentState(State currentState) {
        this.currentState = currentState;
    }

    @Override
    public void merge(AbstractEntity a) {
        //this.currentState = ((StateMachineInstanceEntity) a).getCurrentState();
        this.setCurrentStateId(((StateMachineInstanceEntity) a).getCurrentStateId());
    }

    @Override
    public String toString() {
        return "StateMachineInstanceEntity{" + "id=" + this.getId() + ", currentState=" + currentState + '}';
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

//    @PrePersist
//    public void generateInitialState() {
//        this.currentStateId = ((StateMachineDescriptorEntity) this.getScope().getVariableDescriptor()).getInitialStateId();
//    }
}
