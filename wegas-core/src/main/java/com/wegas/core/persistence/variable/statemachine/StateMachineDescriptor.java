/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.resourceManagement.persistence.DialogueDescriptor;
import java.util.*;
import java.util.Map.Entry;
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
    @JsonSubTypes.Type(name = "TriggerDescriptor", value = TriggerDescriptor.class),
    @JsonSubTypes.Type(name = "DialogueDescriptor", value = DialogueDescriptor.class)
})
public class StateMachineDescriptor extends VariableDescriptor<StateMachineInstance> {

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "statemachine_id", referencedColumnName = "variabledescriptor_id")
    @MapKeyColumn(name = "fsm_statekey")
    private Map<Long, State> states = new HashMap<>();

    /**
     *
     */
    public StateMachineDescriptor() {
    }

    /**
     *
     * @return
     */
    public Map<Long, State> getStates() {
        return states;
    }

    /**
     *
     * @param states
     */
    public void setStates(HashMap<Long, State> states) {
        this.states = states;
    }

    @Override
    public String toString() {
        return "StateMachineDescriptor{id=" + this.getId() + ", states=" + states + '}';
    }

    @Override
    public void merge(AbstractEntity a) {
        StateMachineDescriptor smDescriptor = (StateMachineDescriptor) a;
        this.mergeStates((HashMap<Long, State>) smDescriptor.getStates());
        super.merge(smDescriptor);
    }

    /*
     * script methods
     */
    /**
     *
     * @param p
     */
    public void enable(Player p) {
        this.getInstance(p).setEnabled(Boolean.TRUE);
    }

    /**
     *
     * @param p
     */
    public void disable(Player p) {
        this.getInstance(p).setEnabled(Boolean.FALSE);
    }

    /**
     *
     * @param p
     * @return
     */
    public Boolean isEnabled(Player p) {
        return this.getInstance(p).getEnabled();
    }

    private void mergeStates(HashMap<Long, State> newStates) {
        for (Iterator<Entry<Long, State>> it = this.states.entrySet().iterator(); it.hasNext();) {
            Entry<Long, State> oldState = it.next();
            Long oldKeys = oldState.getKey();
            if (newStates.get(oldKeys) == null) {
                it.remove();
            } else {
                oldState.getValue().merge(newStates.get(oldKeys));
            }
        }
        for (Iterator<Entry<Long, State>> it = newStates.entrySet().iterator(); it.hasNext();) {
            Entry<Long, State> newState = it.next();
            Long newKey = newState.getKey();
            if (this.states.get(newKey) == null) {
                this.states.put(newKey, newState.getValue());
            }
        }
    }
}
