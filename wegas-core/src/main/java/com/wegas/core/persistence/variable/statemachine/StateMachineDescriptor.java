/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.annotations.Scriptable;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
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
    public Set<State> getInternalStates() {
        return states;
    }

    @JsonIgnore
    public void setInternalStates(Set<State> states) {
        this.states = states;
        for (State state : states) {
            state.setStateMachine(this);
        }
    }

    @JsonView(Views.ExtendedI.class)
    public Map<Long, State> getStates() {
        Map<Long, State> map = new HashMap<>();
        for (State state : this.states) {
            map.put(state.getIndex(), state);
        }
        return map;
    }

    public State addState(Long index, State state) {
        state.setIndex(index);
        state.setStateMachine(this);
        this.getInternalStates().add(state);
        return state;
    }

    /**
     * @param states
     */
    public void setStates(Map<Long, State> states) {
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
    @Scriptable(label = "activate")
    public void enable(Player p) {
        this.getInstance(p).setEnabled(Boolean.TRUE);
    }

    /**
     * @param p
     */
    @Scriptable(label = "deactivate")
    public void disable(Player p) {
        this.getInstance(p).setEnabled(Boolean.FALSE);
    }

    /**
     * @param p
     *
     * @return is player instance enabled ?
     */
    @Scriptable(label = "is active")
    public boolean isEnabled(Player p) {
        return this.getInstance(p).getEnabled();
    }

    /**
     * @param p
     *
     * @return is player instance disabled ?
     */
    @Scriptable(label = "is inactive")
    public boolean isDisabled(Player p) {
        return !this.getInstance(p).getEnabled();
    }

    private Transition getTransitionById(Long id) {
        for (State state : this.getInternalStates()) {
            for (Transition transition : state.getTransitions()) {
                if (transition != null && transition.getId().equals(id)) {
                    return transition;
                }
            }
        }
        return null;
    }

    @Scriptable
    public boolean wentThroughState(Player p, Long stateKey) {
        List<Long> transitionHistory = this.getInstance(p).getTransitionHistory();

        for (Long tId : transitionHistory) {
            Transition t = this.getTransitionById(tId);
            if (t.getNextStateId().equals(stateKey)) {
                return true;
            }
        }

        return false;
    }

    @Scriptable(label = "did not went through state")
    public boolean notWentThroughState(Player p, Long stateKey) {
        return !this.wentThroughState(p, stateKey);
    }

}
