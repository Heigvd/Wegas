/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.ejb.ApplicationException;


/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = { 
    @JsonSubTypes.Type(name = "WegasErrorMessage", value = WegasErrorMessage.class),
    @JsonSubTypes.Type(name = "WegasOutOfBoundException", value = WegasOutOfBoundException.class),
    @JsonSubTypes.Type(name = "WegasScriptException", value = WegasScriptException.class),
    @JsonSubTypes.Type(name = "WegasWrappedException", value = WegasWrappedException.class)
})
@JsonIgnoreProperties({"cause", "stackTrace", "suppressed"})
@ApplicationException(rollback = true)
public abstract class WegasRuntimeException extends RuntimeException {

    private static final long serialVersionUID = 1484932586696706035L;

    /**
     *
     */
    public WegasRuntimeException() {
        super();
    }

    public WegasRuntimeException (final Throwable t){
        super(t);
    }
    
    /**
     *
     * @param message
     */
    public WegasRuntimeException(String message) {
        super(message);
    }

    /**
     *
     * @param message
     * @param cause
     */
    public WegasRuntimeException(String message, Throwable cause) {
        super(message, cause);
    }
}
