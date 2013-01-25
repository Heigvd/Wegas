/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
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
