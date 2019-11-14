/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import javax.persistence.*;

/**
 * PMG Related !
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "iteration_id")
})
public class IterationPeriod extends AbstractEntity implements Serializable {

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JsonBackReference
    private Iteration iteration;

    private static final long serialVersionUID = 1L;

    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(label = "Events"))
    @OneToMany(mappedBy = "iterationPeriod", cascade = {CascadeType.ALL}, orphanRemoval = true)
    private List<IterationEvent> iterationEvents;

    /**
     * delta period number
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Period number"))
    private Long periodNumber;

    /**
     * workload adjustment
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Delta workload"))
    private Double deltaAtStart;

    /**
     * AC delta
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Delta AC"))
    private Double deltaAc;

    /**
     * Ev delta
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Delta Ev"))
    private Double deltaEv;

    /**
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Planned Workload (PW)"))
    private Double pw;

    /**
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Initial Planned Team Size"))
    private Double planned;

    /**
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Re-Planned Team Size"))
    private Double replanned;

    /**
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Earned Workload (EW)"))
    private Double ew;

    /**
     * actual cost
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Actual Cost (AC)"))
    private Double ac;

    /**
     * earned value
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Earned Value (EV)"))
    private Double ev;

    /**
     * Period subdivision step
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Last worked step"))
    private Integer lastWorkedStep;

    public List<IterationEvent> getIterationEvents() {
        return iterationEvents;
    }

    public void setIterationEvents(List<IterationEvent> iterationEvents) {
        this.iterationEvents = iterationEvents;
    }

    public Long getPeriodNumber() {
        return periodNumber;
    }

    public void setPeriodNumber(Long periodNumber) {
        this.periodNumber = periodNumber;
    }

    public Integer getLastWorkedStep() {
        return lastWorkedStep;
    }

    public void setLastWorkedStep(Integer lastWorkedStep) {
        this.lastWorkedStep = lastWorkedStep;
    }

    public Iteration getIteration() {
        return iteration;
    }

    public void setIteration(Iteration iteration) {
        this.iteration = iteration;
    }

    public Double getDeltaAtStart() {
        return deltaAtStart;
    }

    public void setDeltaAtStart(Double deltaAtStart) {
        this.deltaAtStart = deltaAtStart;
    }

    public Double getDeltaAc() {
        return deltaAc;
    }

    public void setDeltaAc(Double deltaAc) {
        this.deltaAc = deltaAc;
    }

    public Double getDeltaEv() {
        return deltaEv;
    }

    public void setDeltaEv(Double deltaEv) {
        this.deltaEv = deltaEv;
    }

    public Double getPw() {
        return pw;
    }

    public void setPw(Double pw) {
        this.pw = pw;
    }

    public Double getPlanned() {
        return planned;
    }

    public void setPlanned(Double planned) {
        this.planned = planned;
    }

    public Double getReplanned() {
        return replanned;
    }

    public void setReplanned(Double replanned) {
        this.replanned = replanned;
    }

    public Double getEw() {
        return ew;
    }

    public void setEw(Double ew) {
        this.ew = ew;
    }

    public Double getAc() {
        return ac;
    }

    public void setAc(Double ac) {
        this.ac = ac;
    }

    public Double getEv() {
        return ev;
    }

    public void setEv(Double ev) {
        this.ev = ev;
    }

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param event
     */
    public void addEvent(IterationEvent event) {
        event.setIterationPeriod(this);
        this.setIterationEvents(ListUtils.cloneAdd(this.getIterationEvents(), event));
    }

    public void removeEvent(IterationEvent event) {
        this.iterationEvents.remove(event);
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getIteration();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getIteration().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getIteration().getRequieredReadPermission();
    }
}
