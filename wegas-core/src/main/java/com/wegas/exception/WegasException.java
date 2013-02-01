/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.exception;

import javax.ejb.ApplicationException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@ApplicationException(rollback = false)
public class WegasException extends RuntimeException {

    /**
     *
     */
    public WegasException() {
    }

    /**
     *
     * @param message
     */
    public WegasException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public WegasException(String message, Throwable cause) {
        super(message, cause);
    }
}
