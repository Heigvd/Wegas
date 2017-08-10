/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
import java.io.Serializable;

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
    private Long periodNumber;

    /**
     * workload to do before doing the period
     */
    private Double workload;

    /**
     * effective workload spent during the last period
     */
    private Double spentWorkload;

    /**
     * Period subdivision step
     */
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

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Workload) {
            Workload o = (Workload) other;
            this.setPeriodNumber(o.getPeriodNumber());
            this.setWorkload(o.getWorkload());
            this.setSpentWorkload(o.getSpentWorkload());
            this.setLastWorkedStep(o.getLastWorkedStep());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }
}
