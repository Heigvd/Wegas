/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception;

import javax.ejb.ApplicationException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ApplicationException(rollback = false)
public class PersistenceException extends RuntimeException {

    /**
     *
     */
    public PersistenceException() {
        super();
    }

    /**
     *
     * @param cause
     */
    public PersistenceException(final Throwable cause) {
        super(cause);
    }
}
