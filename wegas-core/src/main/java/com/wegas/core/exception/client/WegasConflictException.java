/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

import jakarta.ws.rs.core.Response.Status;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasConflictException extends WegasRuntimeException {

    private static final long serialVersionUID = -1552844893055754079L;

    public WegasConflictException(String message) {
        super(message, Status.CONFLICT);
    }

    public WegasConflictException() {
        super(Status.CONFLICT);
    }

    public WegasConflictException(Throwable t) {
        super(t, Status.CONFLICT);
    }
}
