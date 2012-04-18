/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@XmlType(name = "FSMDescriptor")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class FiniteStateMachineDescriptorEntity extends VariableDescriptorEntity<FiniteStateMachineInstanceEntity> {

    @Id
    @GeneratedValue
    private Long id;
    private String label;
    private Integer initialStateId;
    @ElementCollection(fetch = FetchType.EAGER)
    @MapKeyColumn(name = "state_id")
    private Map<Integer, State> states = new HashMap<>();

    public FiniteStateMachineDescriptorEntity() {
    }

    public Integer getInitialStateId() {
        return initialStateId;
    }

    public void setInitialStateId(Integer initialStateId) {
        this.initialStateId = initialStateId;
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

    @Override
    public String toString() {
        return "FiniteStateMachineDescriptorEntity{" + "label=" + label + ", initialStateId=" + initialStateId + ", states=" + states + '}';
    }
}
