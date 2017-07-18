/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

/**
 *
 * @author maxence
 */
public interface Populatable {

    public enum Status {
        WAITING,
        RESCHEDULED,
        PROCESSING,
        SEC_PROCESSING,
        LIVE,
        FAILED,
        DELETED
    }

    Status getStatus();

    void setStatus(Status status);

    default boolean isWaiting() {
        return this.getStatus().equals(Status.WAITING) || this.getStatus().equals(Status.RESCHEDULED);
    }
}
