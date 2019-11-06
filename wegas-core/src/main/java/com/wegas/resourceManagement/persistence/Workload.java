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
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.io.Serializable;
import java.util.Collection;
import javax.persistence.*;

/**
 * PMG Related !
 *
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "iteration_id")
})
public class Workload extends AbstractEntity implements Serializable {

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

    /**
     * period number
     */
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(label = "Period number"))
    private Long periodNumber;

    /**
     * workload to do before doing the period
     */
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(label = "Workload"))
    private Double workload;

    /**
     * effective workload spent during the last period
     */
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(label = "Spent (AW)"))
    private Double spentWorkload;

    /**
     * actual cost
     */
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(label = "Actual Cost (AC)"))
    private Double ac;

    /**
     * actual cost
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

    public Long getPeriodNumber() {
        return periodNumber;
    }

    public void setPeriodNumber(Long periodNumber) {
        this.periodNumber = periodNumber;
    }

    public Double getWorkload() {
        return workload;
    }

    public void setWorkload(Double workload) {
        this.workload = workload;
    }

    public Double getSpentWorkload() {
        return spentWorkload;
    }

    public void setSpentWorkload(Double spentWorkload) {
        this.spentWorkload = spentWorkload;
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
