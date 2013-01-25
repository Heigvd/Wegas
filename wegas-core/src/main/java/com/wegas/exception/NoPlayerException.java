/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.exception;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class NoPlayerException extends WegasException {

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
