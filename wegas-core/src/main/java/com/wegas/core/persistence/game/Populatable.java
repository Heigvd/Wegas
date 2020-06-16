/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

/**
 *
 * @author maxence
 */
public interface Populatable {

    enum Status {
        /**
         * same as live but only populated with survey related instances
         */
        SURVEY,
        WAITING,
        RESCHEDULED,
        PROCESSING,
        SEC_PROCESSING,
        INITIALIZING,
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
