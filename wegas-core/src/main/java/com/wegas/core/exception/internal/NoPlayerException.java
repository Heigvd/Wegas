/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class NoPlayerException extends WegasInternalException {

    /**
     *
     */
    public NoPlayerException() {
    }

    /**
     *
     * @param message
     */
    public NoPlayerException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public NoPlayerException(String message, Throwable cause) {
        super(message, cause);
    }
}
