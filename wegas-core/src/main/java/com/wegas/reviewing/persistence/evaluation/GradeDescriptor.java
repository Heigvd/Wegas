 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.AbstractEntity;

/**
 * Define an grade-like evaluation by defined a scale (min and max)
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class GradeDescriptor extends EvaluationDescriptor<GradeInstance> {

    private Double minValue;

    private Double maxValue;

    /**
     * get the minimum allowed value. NULL means no boundary
     *
     * @return minimum boundary
     */
    public Double getMinValue() {
        return minValue;
    }

    /**
     * Set the minimum allowed value (included)
     *
     * @param minValue
     */
    public void setMinValue(Double minValue) {
        this.minValue = minValue;
    }

    /**
     * get the maximum allowed value. NULL means no boundary
     *
     * @return minimum boundary
     */
    public Double getMaxValue() {
        return maxValue;
    }

    /*
     * Set the maximum allowed value (included)
     * 
     * @param minValue 
     */
    public void setMaxValue(Double maxValue) {
        this.maxValue = maxValue;
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof GradeDescriptor) {
            GradeDescriptor o = (GradeDescriptor) a;
            super.merge(a);
            this.setMinValue(o.getMinValue());
            this.setMaxValue(o.getMaxValue());
        }
    }
}
