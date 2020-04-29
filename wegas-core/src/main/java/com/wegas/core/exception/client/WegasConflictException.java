/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasConflictException extends WegasRuntimeException {

    private static final long serialVersionUID = -1552844893055754079L;

    public WegasConflictException(String message) {
        super(message);
    }

    public WegasConflictException() {
        super();
    }

    public WegasConflictException(Throwable t) {
        super(t);
    }
}
