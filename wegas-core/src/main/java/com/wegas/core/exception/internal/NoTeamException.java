/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class NoTeamException extends WegasInternalException {

    /**
     *
     */
    public NoTeamException() {
    }

    /**
     *
     * @param message
     */
    public NoTeamException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public NoTeamException(String message, Throwable cause) {
        super(message, cause);
    }
}
