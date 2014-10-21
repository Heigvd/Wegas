/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ExceptionEvent extends ClientEvent {
private static final long serialVersionUID = 1L;
    private List<Exception> exceptions;

    /**
     *
     */
    public ExceptionEvent() {
    }

    /**
     *
     * @param exceptions
     */
    public ExceptionEvent(List<Exception> exceptions) {
        this.exceptions = exceptions;
    }

    /**
     *
     * @return
     */
    public List<Exception> getExceptions() {
        return exceptions;
    }

    /**
     *
     * @param exceptions
     */
    public void setExceptions(List<Exception> exceptions) {
        this.exceptions = exceptions;
    }
}
