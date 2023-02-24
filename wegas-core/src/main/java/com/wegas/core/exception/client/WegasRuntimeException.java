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
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

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

    private final Status httpStatus;

    /**
     *
     */
    public WegasRuntimeException() {
        this(Status.BAD_REQUEST);
    }

    /**
     *
     * @param t          the cause
     */
    public WegasRuntimeException(final Throwable t) {
        this(t, Status.BAD_REQUEST);
    }

    /**
     *
     * @param message
     */
    public WegasRuntimeException(String message) {
        this(message, Status.BAD_REQUEST);
    }

    /**
     *
     * @param message    custom message
     * @param cause      the cause
     */
    public WegasRuntimeException(String message, Throwable cause) {
        this(message, cause, Status.BAD_REQUEST);
    }

    /**
     *
     * @param httpStatus 4xx http status
     */
    public WegasRuntimeException(Status httpStatus) {
        super();
        this.httpStatus = httpStatus;
    }

    /**
     *
     * @param t          the cause
     * @param httpStatus 4xx http status
     */
    public WegasRuntimeException(final Throwable t, Status httpStatus) {
        super(t);
        this.httpStatus = httpStatus;
    }

    /**
     *
     * @param message
     * @param httpStatus 4xx http status
     */
    public WegasRuntimeException(String message, Status httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    /**
     *
     * @param message    custom message
     * @param cause      the cause
     * @param httpStatus 4xx http status
     */
    public WegasRuntimeException(String message, Throwable cause, Status httpStatus) {
        super(message, cause);
        this.httpStatus = httpStatus;
    }

    /**
     * Get corresponding http status
     *
     * @return
     */
    public Response.Status getHttpStatus() {
        return httpStatus;
    }
}
