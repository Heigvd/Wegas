/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.wegas.core.exception.client.WegasRuntimeException;
import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class ExceptionEvent extends ClientEvent {

    private static final long serialVersionUID = 1L;
    private List<WegasRuntimeException> exceptions;

    /**
     *
     */
    public ExceptionEvent() {
    }

    /**
     *
     * @param exceptions
     */
    public ExceptionEvent(List<WegasRuntimeException> exceptions) {
        this.exceptions = exceptions;
    }

    /**
     *
     * @return
     */
    public List<WegasRuntimeException> getExceptions() {
        return exceptions;
    }

    /**
     *
     * @param exceptions
     */
    public void setExceptions(List<WegasRuntimeException> exceptions) {
        this.exceptions = exceptions;
    }
}
