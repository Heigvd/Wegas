/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
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
