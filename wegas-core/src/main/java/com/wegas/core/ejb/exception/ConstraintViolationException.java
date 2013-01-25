/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb.exception;

import javax.ejb.ApplicationException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ApplicationException(rollback=true)
public class ConstraintViolationException extends RuntimeException {

    /**
     *
     */
    public ConstraintViolationException() {
        super();
    }

    /**
     *
     * @param cause
     */
    public ConstraintViolationException(Throwable cause) {
        super(cause);
    }

    /**
     *
     * @param msg
     * @param cause
     */
    public ConstraintViolationException(String msg, Throwable cause) {
        super(msg, cause);
    }

    /**
     *
     * @param msg
     */
    public ConstraintViolationException(String msg) {
        super(msg);
    }
}
