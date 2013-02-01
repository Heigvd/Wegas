/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.exception;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class NoGameException extends WegasException {

    /**
     *
     */
    public NoGameException() {
    }

    /**
     *
     * @param message
     */
    public NoGameException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public NoGameException(String message, Throwable cause) {
        super(message, cause);
    }
}
