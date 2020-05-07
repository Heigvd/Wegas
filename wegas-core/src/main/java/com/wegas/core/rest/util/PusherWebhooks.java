/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import java.util.List;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class PusherWebhooks {

    private List<PusherChannelExistenceWebhook> events;

    private Long time_ms;

    @SuppressWarnings("PMD")
    public Long getTime_ms() {
        return time_ms;
    }

    @SuppressWarnings("PMD")
    public void setTime_ms(Long time_ms) {
        this.time_ms = time_ms;
    }

    public List<PusherChannelExistenceWebhook> getEvents() {
        return events;
    }

    public void setEvents(List<PusherChannelExistenceWebhook> events) {
        this.events = events;
    }
}
