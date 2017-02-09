/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class WegasOutOfBoundException extends WegasRuntimeException {

    private static final long serialVersionUID = 6812085119211277213L;

    private final Double min;
    private final Double max;
    private final Double value;
    private final String variableName;

    /**
     *
     * @param min
     * @param max
     * @param value
     * @param variableName
     */
    public WegasOutOfBoundException(Double min, Double max, Double value, String variableName) {
        super();
        this.min = min;
        this.max = max;
        this.value = value;
        this.variableName = variableName;
    }

    public Double getMin() {
        return min;
    }

    public Double getMax() {
        return max;
    }

    public Double getValue() {
        return value;
    }

    public String getVariableName(){
        return variableName;
    }
}
