/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
    private final String label;

    /**
     *
     * @param min
     * @param max
     * @param value
     * @param variableName
     * @param label
     */
    public WegasOutOfBoundException(Double min, Double max, Double value, String variableName, String label) {
        super();
        this.min = min;
        this.max = max;
        this.value = value;
        this.variableName = variableName;
        this.label = label;
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

    public String getVariableName() {
        return variableName;
    }

    public String getLabel() {
        return label;
    }
}
