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
public class NoRollBackException extends WegasException {

    /**
     *
     */
    public NoRollBackException() {
    }

    /**
     *
     * @param message
     */
    public NoRollBackException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public NoRollBackException(String message, Throwable cause) {
        super(message, cause);
    }
}
