/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

import com.wegas.core.persistence.variable.VariableDescriptor;

/**
 *
 * @author Maxence Laurent <maxence.laurent gmail.com>
 */
public class WegasOutOfBoundException extends WegasRuntimeException {

    private final Long min;
    private final Long max;
    private final Double value;
    private final String variableName;

    /**
     *
     * @param min
     * @param max
     * @param value
     * @param variableName
     */
    public WegasOutOfBoundException(Long min, Long max, Double value, String variableName) {
        super();
        this.min = min;
        this.max = max;
        this.value = value;
        this.variableName = variableName;
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

    public String getVariableName(){
        return variableName;
    }
}
