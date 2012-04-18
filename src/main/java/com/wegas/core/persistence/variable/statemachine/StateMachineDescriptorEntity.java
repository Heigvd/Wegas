/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.variable.statemachine;

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
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @MapKey(name = "id")
    @JoinColumn(name = "statemachine_id", referencedColumnName = "variabledescriptor_id")
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
//    @PostPersist
//    public void generateInitialState() {
//        StateMachineInstanceEntity smInstance = (StateMachineInstanceEntity) this.getDefaultVariableInstance();
//        if (smInstance.getCurrentStateId() == null) {
//            Iterator<State> it = this.getStates().values().iterator();
//            if (it.hasNext()) {
//                smInstance.setCurrentStateId(it.next().getId());
//                this.initialStateId = smInstance.getCurrentStateId();
//            }
//        }
//    }
}
