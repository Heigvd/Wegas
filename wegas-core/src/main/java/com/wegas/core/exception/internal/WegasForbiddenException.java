/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;


/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class WegasForbiddenException extends WegasInternalException {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    public WegasForbiddenException() {
        super();
    }

    /**
     *
     * @param message
     */
    public WegasForbiddenException(String message) {
        super(message);
    }

    /**
     *
     * @param cause
     */
    public WegasForbiddenException(final Throwable cause) {
        super(cause);
    }
}
