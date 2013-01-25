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
public class NoTeamException extends WegasException {

    /**
     *
     */
    public NoTeamException() {
    }

    /**
     *
     * @param message
     */
    public NoTeamException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public NoTeamException(String message, Throwable cause) {
        super(message, cause);
    }
}
