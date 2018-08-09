/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.*;
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
    private Map<Long, State> states = new HashMap<>();

    /**
     *
     */
    public StateMachineDescriptor() {
    }

    /**
     * @return all stated mapped by index numbers
     */
    public Map<Long, State> getStates() {
        return states;
    }

    public State addState(Long index, State state) {
        this.getStates().put(index, state);
        state.setStateMachine(this);
        return state;
    }

    /**
     * @param states
     */
    public void setStates(Map<Long, State> states) {
        this.states = states;
        for (State state : states.values()) {
            state.setStateMachine(this);
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
