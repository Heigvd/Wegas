/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.external;

import com.wegas.core.persistence.variable.VariableDescriptor;

/**
 *
 * @author Maxence Laurent <maxence.laurent gmail.com>
 */
public class WegasOutOfBoundException extends WegasRuntimeException {

    private final Long min;
    private final Long max;
    private final Double value;
    private final VariableDescriptor vDesc;

    /**
     *
     * @param min
     * @param max
     * @param value
     * @param vDesc
     */
    public WegasOutOfBoundException(Long min, Long max, Double value, VariableDescriptor vDesc) {
        super();
        this.min = min;
        this.max = max;
        this.value = value;
        this.vDesc = vDesc;
    }

    public Long getMin() {
        return min;
    }

    public Long getMax() {
        return max;
    }

    public Double getValue() {
        return value;
    }

    public VariableDescriptor getVariableDescriptor(){
        return vDesc;
    }
}
