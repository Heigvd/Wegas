/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyMap;
import com.wegas.editor.view.Hidden;
import java.util.*;
import java.util.Map.Entry;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 * @param <T>
 * @param <U>
 */
@Entity
//@Table(name = "FSMDescriptor")
//@JsonTypeName(value = "FSMDescriptor")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StateMachineDescriptor", value = StateMachineDescriptor.class),
    @JsonSubTypes.Type(name = "TriggerDescriptor", value = TriggerDescriptor.class),
    @JsonSubTypes.Type(name = "DialogueDescriptor", value = DialogueDescriptor.class)
})
@NamedQueries(
    @NamedQuery(
        name = "StateMachineDescriptor.findAllForGameModelId",
        query = "SELECT DISTINCT sm FROM StateMachineDescriptor sm WHERE sm.gameModel.id = :gameModelId"
    )
)
public abstract class AbstractStateMachineDescriptor< T extends AbstractState<U>, U extends AbstractTransition> extends VariableDescriptor<StateMachineInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "stateMachine", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @MapKeyColumn(name = "fsm_statekey")
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(ignoreNull = true, protectionLevel = ProtectionLevel.INHERITED,
        optional = false, nullable = false, proposal = EmptyMap.class,
        view = @View(label = "", value = Hidden.class))
    /*
     * // DON'T DO THAT:
     * private Set<T> states = new HashSet<>();
     *
     * `this#states` should be of type `Set<T>`, nonetheless, such a typing leads to very
     * unexpected behaviour.
     *
     * For instance, regarding `TriggerDescriptor`, the `states` field would always be null.
     * It seems JPA is unable to load data from database (despite data exists in DB) if the relation
     * is defined with `T`.
     *
     * Workaround:
     * Defining `states` as a set of `AbstractState` is working well:
     */
    private Set<AbstractState<U>> states = new HashSet<>();

    /**
     *
     */
    public AbstractStateMachineDescriptor() {
        // ensure there is a default constructor
    }

    /**
     * @return all stated mapped by index numbers
     */
    @JsonIgnore
    public Set<T> getInternalStates() {
        return (Set<T>) states;
    }

    @JsonIgnore
    public void setInternalStates(Set<T> states) {
        this.states = (Set<AbstractState<U>>) states;
        for (T state : states) {
            state.setStateMachine(this);
        }
    }

    @JsonView(Views.ExtendedI.class)
    public Map<Long, T> getStates() {
        Map<Long, T> tMap = new TreeMap<>();

        ((Set<T>) this.states).forEach(state -> {
            tMap.put(state.getIndex(), state);
        });

        return tMap;
    }

    public T addState(Long index, T state) {
        state.setIndex(index);
        state.setStateMachine(this);
        this.getInternalStates().add(state);
        return state;
    }

    /**
     * @param states
     */
    public void setStates(Map<Long, T> states) {
        this.states.clear();

        for (Entry<Long, T> entry : states.entrySet()) {
            this.addState(entry.getKey(), entry.getValue());
        }
    }

    @JsonIgnore
    public AbstractState<U> getState(Long currentStateId) {
        for (AbstractState<U> state : this.states) {
            if (state.getIndex().equals(currentStateId)) {
                return state;
            }
        }
        return null;
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
    @Scriptable(label = "activate", dependsOn = DependencyScope.NONE)
    public void enable(Player p) {
        this.getInstance(p).setEnabled(Boolean.TRUE);
    }

    /**
     * @param p
     */
    @Scriptable(label = "deactivate", dependsOn = DependencyScope.NONE)
    public void disable(Player p) {
        this.getInstance(p).setEnabled(Boolean.FALSE);
    }

    /**
     * @param p
     *
     * @return is player instance enabled ?
     */
    @Scriptable(label = "is active", dependsOn = DependencyScope.SELF)
    public boolean isEnabled(Player p) {
        return this.getInstance(p).getEnabled();
    }

    /**
     * @param p
     *
     * @return is player instance disabled ?
     */
    @Scriptable(label = "is inactive", dependsOn = DependencyScope.SELF)
    public boolean isDisabled(Player p) {
        return !this.getInstance(p).getEnabled();
    }

    private U getTransitionById(Long id) {
        for (T state : this.getInternalStates()) {
            for (U transition : state.getInternalTransitions()) {
                if (transition != null && transition.getId().equals(id)) {
                    return transition;
                }
            }
        }
        return null;
    }

    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean wentThroughState(Player p, Long stateKey) {
        List<Long> transitionHistory = this.getInstance(p).getTransitionHistory();

        for (Long tId : transitionHistory) {
            U t = this.getTransitionById(tId);
            if (t.getNextStateId().equals(stateKey)) {
                return true;
            }
        }

        return false;
    }

    @Scriptable(label = "did not went through state", dependsOn = DependencyScope.SELF)
    public boolean notWentThroughState(Player p, Long stateKey) {
        return !this.wentThroughState(p, stateKey);
    }

}
