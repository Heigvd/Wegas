/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

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
    private List<IterationEvent> iterationEvents = new ArrayList<>();

    /**
     * delta period number
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Period number"))
    private Long periodNumber;

    /**
     * workload to do adjustment
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Delta workload"))
    private Double deltaAtStart;

    /**
     * AC adjustment at start
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Delta AC"))
    private Double deltaAc;

    /**
     * Ev adjustment at start
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Delta Ev"))
    private Double deltaEv;

    /**
     * pw "done" during this period
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Planned Workload (PW)"))
    private Double pw;

    /**
     * Planned workload
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Initial Planned Team Size"))
    private Double planned;

    /**
     * Replanned workload
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Re-Planned Team Size"))
    private Double replanned;

    /**
     * earned workload "done" during this period
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Earned Workload (EW)"))
    private Double ew;

    /*
     * actual workload spent during this period.
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Actual Workload (AW)"))
    private Double aw;

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
        if (this.iterationEvents != null) {
            for (IterationEvent event : this.iterationEvents) {
                event.setIterationPeriod(this);
            }
        }
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

    public Double getAw() {
        return aw;
    }

    public void setAw(Double aw) {
        this.aw = aw;
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

    public void addStartTaskEvent(TaskInstance taskInstante, int step) {
        IterationEvent event = new IterationEvent();
        event.setEventType(IterationEvent.EventType.START_TASK);
        event.setStep(step);
        event.setTaskInstance(taskInstante);
        this.addEvent(event);
    }

    public void addEndOfTaskEvent(TaskInstance taskInstante, int step) {
        IterationEvent event = new IterationEvent();
        event.setEventType(IterationEvent.EventType.COMPLETE_TASK);
        event.setStep(step);
        event.setTaskInstance(taskInstante);
        this.addEvent(event);
    }

    public void addWorkloadAdjustmentEvent() {
        IterationEvent event = new IterationEvent();
        event.setEventType(IterationEvent.EventType.WORKLOAD_ADJUSTMENT);
        this.addEvent(event);
    }

    public void addAcAdjustmentEvent() {
        IterationEvent event = new IterationEvent();
        event.setEventType(IterationEvent.EventType.SPENT_ADJUSTMENT);
        this.addEvent(event);
    }

    public void addEvAdjustmentEvent() {
        IterationEvent event = new IterationEvent();
        event.setEventType(IterationEvent.EventType.BUDGETED_ADJUSTMENT);
        this.addEvent(event);
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getIteration();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getIteration().getRequieredUpdatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getIteration().getRequieredReadPermission(context);
    }
}
