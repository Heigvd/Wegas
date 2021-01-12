/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;

/**
 * Such an exception MUST be internally treated
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public abstract class WegasInternalException extends Exception {

    /**
     *
     */
    public WegasInternalException() {
        // ensure there is a default constructor
    }

    public WegasInternalException(final Throwable t) {
        super(t);
    }

    /**
     *
     * @param message
     */
    public WegasInternalException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public WegasInternalException(String message, Throwable cause) {
        super(message, cause);
    }
}
