/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.Helper;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.One;
import com.wegas.editor.ValueGenerators.True;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.ADVANCED;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.NumberView;
import com.wegas.editor.View.View;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(name = "FSMinstance"/*,
        indexes = {
            @Index(columnList = "transitionHistory.statemachineinstance_id")
        }*/
)
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@Access(AccessType.FIELD)
@JsonTypeName(value = "FSMInstance")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "TriggerInstance", value = StateMachineInstance.class)
})
@JsonIgnoreProperties("currentState")
public class StateMachineInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Column(name = "currentstate_id")
    @WegasEntityProperty(
            proposal = One.class,
            nullable = false,
            optional = false,
            view = @View(
                    label = "Current State id",
                    featureLevel = ADVANCED,
                    readOnly = true,
                    value = NumberView.class
            ))
    private Long currentStateId;
    /**
     *
     */
    @Column(columnDefinition = "boolean default true")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = True.class,
            view = @View(label = "Enable"))
    private Boolean enabled = true;
    /**
     *
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "transitionHistory")
    @JsonIgnore
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Transition history", value = Hidden.class))
    // history refers to ids of travelled transitions
    private List<TransitionHistoryEntry> transitionHistory = new ArrayList<>();

    /**
     *
     * @return the current state
     */
    @JsonIgnore
    public AbstractState getCurrentState() {
        return ((AbstractStateMachineDescriptor) this.findDescriptor()).getState(this.currentStateId);
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

    /**
     *
     * @return true if the state machine enabled ?
     */
    public Boolean getEnabled() {
        return enabled;
    }

    /**
     *
     * @param enabled
     */
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    /**
     *
     * @return list of walked transitions
     */
    @JsonProperty
    public List<Long> getTransitionHistory() {
        List<TransitionHistoryEntry> copy = Helper.copyAndSort(this.transitionHistory, new EntityComparators.OrderComparator<>());

        List<Long> h = new ArrayList<>();
        for (TransitionHistoryEntry entry : copy) {
            h.add(entry.getTansitionId());
        }
        return h;
    }

    @JsonProperty
    public void setTransitionHistory(List<Long> transitionHistory) {
        this.transitionHistory.clear();
        if (transitionHistory != null) {
            for (int i = 0; i < transitionHistory.size(); i++) {
                this.transitionHistory.add(new TransitionHistoryEntry(transitionHistory.get(i), i));
            }
        }
    }

    /**
     *
     * @param id
     */
    public void transitionHistoryAdd(Long id) {
        List<Long> h = this.getTransitionHistory();
        h.add(id);
        this.setTransitionHistory(h);
    }

    @Override
    public String toString() {
        return "StateMachineInstance{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }
}
