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
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Scripted;
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
public class StateMachineDescriptor extends VariableDescriptor<StateMachineInstance> implements Scripted {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "statemachine_id", referencedColumnName = "variabledescriptor_id")
    @MapKeyColumn(name = "fsm_statekey")
    @JsonView(Views.ExtendedI.class)
    @WegasEntityProperty(ignoreNull = true)
    private Map<Long, State> states = new HashMap<>();

    /**
     *
     */
    public StateMachineDescriptor() {
    }

    @Override
    public List<Script> getScripts() {
        List<Script> ret = new ArrayList<>();
        for (State state : this.getStates().values()) {
            ret.addAll(state.getScripts());
        }
        return ret;
    }

    /**
     * @return all stated mapped by index numbers
     */
    public Map<Long, State> getStates() {
        return states;
    }

    public State addState(Long index, State state){
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
     * @return is player instance enabled ?
     */
    public boolean isEnabled(Player p) {
        return this.getInstance(p).getEnabled();
    }

    /**
     * @param p
     * @return is player instance disabled ?
     */
    public boolean isDisabled(Player p) {
        return !this.getInstance(p).getEnabled();
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        if (super.containsAll(criterias)) {
            return true;
        }
        for (State s : this.getStates().values()) {
            if (s.containsAll(criterias)) {
                return true;
            }
        }
        return false;
    }
}
