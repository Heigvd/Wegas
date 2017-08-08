/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;

/**
 * Such an exception MUST be internally treated
 * 
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public abstract class WegasInternalException extends Exception {

    /**
     *
     */
    public WegasInternalException() {
    }

    public WegasInternalException (final Throwable t){
        super(t);
    }
    
    /**
     *
     * @param message
     */
    public WegasInternalException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public WegasInternalException(String message, Throwable cause) {
        super(message, cause);
    }
}
