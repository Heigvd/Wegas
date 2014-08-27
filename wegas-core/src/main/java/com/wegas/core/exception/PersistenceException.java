/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class PersistenceException extends RuntimeException {

    /**
     *
     */
    public PersistenceException() {
        super();
    }

    /**
     *
     * @param message
     */
    public PersistenceException(String message) {
        super(message);
    }

    /**
     *
     * @param cause
     */
    public PersistenceException(final Throwable cause) {
        super(cause);
    }
}
