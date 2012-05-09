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
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "FSMDescriptor")
@XmlType(name = "FSMDescriptor")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "TriggerDescriptor", value = TriggerDescriptorEntity.class)
})
public class StateMachineDescriptorEntity extends VariableDescriptorEntity<StateMachineInstanceEntity> {

    private Long initialStateId;
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    //@MapKey(name = "id")
    @JoinColumn(name = "statemachine_id", referencedColumnName = "variabledescriptor_id")
    @MapKeyColumn(name = "fsm_statekey")
    private Map<Long, State> states = new HashMap<>();

    public StateMachineDescriptorEntity() {
    }

    public Long getInitialStateId() {
        return initialStateId;
    }

    public void setInitialStateId(Long initialStateId) {
        this.initialStateId = initialStateId;
    }

    public Map<Long, State> getStates() {
        return states;
    }

    public void setStates(HashMap<Long, State> states) {
        this.states = states;
    }

    @Override
    public String toString() {
        return "StateMachineDescriptorEntity{id=" + this.getId() + ", initialStateId=" + initialStateId + ", states=" + states + '}';
    }

    @Override
    public void merge(AbstractEntity a) {
        StateMachineDescriptorEntity smDescriptor = (StateMachineDescriptorEntity) a;
        this.mergeStates((HashMap<Long, State>) smDescriptor.getStates());
        this.initialStateId = smDescriptor.initialStateId;
        super.merge(smDescriptor);
    }

    private void mergeStates(HashMap<Long, State> newStates) {
        for (Long oldKeys : this.states.keySet()) {
            if (newStates.get(oldKeys) == null) {
                this.states.remove(oldKeys);
            } else {
                this.states.get(oldKeys).merge(newStates.get(oldKeys));
            }
        }
        Iterator<Long> it = newStates.keySet().iterator();
        while (it.hasNext()) {
            Long newKey = it.next();
            if (this.states.get(newKey) == null) {
                this.states.put(newKey, newStates.get(newKey));
            }
        }
    }
}
