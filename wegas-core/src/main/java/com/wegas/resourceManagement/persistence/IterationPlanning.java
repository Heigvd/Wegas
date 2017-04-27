/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015, 2016, 2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.ListUtils;
import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Embeddable;

/**
 *
 * @author maxence
 */
@Embeddable
public class IterationPlanning implements Serializable {

    private static final long serialVersionUID = 1647739633795326491L;

    @Column(name = "workload")
    private Double workload;

    @Column(name = "period")
    private Long period;

    public IterationPlanning() {
    }

    public IterationPlanning(Long period, Double workload) {
        this.workload = workload;
        this.period = period;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj != null && obj instanceof IterationPlanning) {
            IterationPlanning other = (IterationPlanning) obj;
            return this.getPeriod().equals(other.getPeriod());
        }
        return false;
    }

    public Long getPeriod() {
        return period;
    }

    public void setPeriod(Long period) {
        this.period = period;
    }

    public Double getWorkload() {
        return workload;
    }

    public void setWorkload(Double workload) {
        this.workload = workload;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 59 * hash + (int) (this.period ^ (this.period >>> 32));
        return hash;
    }

    public static class Extractor implements ListUtils.EntryExtractor<Long, Double, IterationPlanning> {

        @Override
        public Long getKey(IterationPlanning item) {
            return item.getPeriod();
        }

        @Override
        public Double getValue(IterationPlanning item) {
            return item.getWorkload();
        }
    }
}
