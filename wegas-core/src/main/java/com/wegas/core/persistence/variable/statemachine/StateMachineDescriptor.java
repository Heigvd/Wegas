/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.*;
import java.util.Map.Entry;
import javax.persistence.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(name = "FSMDescriptor")
@JsonTypeName(value = "FSMDescriptor")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "TriggerDescriptor", value = TriggerDescriptor.class),
    @JsonSubTypes.Type(name = "DialogueDescriptor", value = DialogueDescriptor.class)
})
@NamedQueries(
        @NamedQuery(
                name = "StateMachineDescriptor.findAllForGameModelId",
                query = "SELECT DISTINCT sm FROM StateMachineDescriptor sm WHERE sm.gameModel.id = :gameModelId"
        )
)
public class StateMachineDescriptor extends VariableDescriptor<StateMachineInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "stateMachine", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @MapKeyColumn(name = "fsm_statekey")
    @JsonView(Views.ExtendedI.class)
    @WegasEntityProperty(ignoreNull = true, protectionLevel = ProtectionLevel.INHERITED)
    private Set<State> states = new HashSet<>();

    /**
     *
     */
    public StateMachineDescriptor() {
    }

    /**
     * @return all stated mapped by index numbers
     */
    @JsonIgnore
    public Set<State> getStates() {
        return states;
    }

    @JsonIgnore
    public void setStates(Set<State> states) {
        this.states = states;
        for (State state : states){
            state.setStateMachine(this);
        }
    }



    @JsonProperty(value = "states")
    @JsonView(Views.ExtendedI.class)
    public Map<Long, State> getStatesAsMap() {
        Map<Long, State> map = new HashMap<>();
        for (State state : this.states) {
            map.put(state.getIndex(), state);
        }
        return map;
    }

    public State addState(Long index, State state) {
        state.setIndex(index);
        state.setStateMachine(this);
        this.getStates().add(state);
        return state;
    }

    /**
     * @param states
     */
    @JsonProperty("states")
    public void setStatesFromMap(Map<Long, State> states) {
        this.states.clear();

        for (Entry<Long, State> entry : states.entrySet()) {
            this.addState(entry.getKey(), entry.getValue());
        }
    }

    @Override
    public String toString() {
        return "StateMachineDescriptor{id=" + this.getId() + ", states=" + states + '}';
    }


    /*
     * script methods
     */
    /**
     * @param p
     */
    public void enable(Player p) {
        this.getInstance(p).setEnabled(Boolean.TRUE);
    }

    /**
     * @param p
     */
    public void disable(Player p) {
        this.getInstance(p).setEnabled(Boolean.FALSE);
    }

    /**
     * @param p
     *
     * @return is player instance enabled ?
     */
    public boolean isEnabled(Player p) {
        return this.getInstance(p).getEnabled();
    }

    /**
     * @param p
     *
     * @return is player instance disabled ?
     */
    public boolean isDisabled(Player p) {
        return !this.getInstance(p).getEnabled();
    }

}
