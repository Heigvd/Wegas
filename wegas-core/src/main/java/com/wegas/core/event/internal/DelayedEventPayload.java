/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import java.io.Serializable;

/**
 *
 * @author maxence
 */
public class DelayedEventPayload implements Serializable {

    private static final long serialVersionUID = -7269568903255884057L;

    private final long playerId;
    private final String eventName;

    public DelayedEventPayload(long playerId, String eventName) {
        this.playerId = playerId;
        this.eventName = eventName;
    }

    public long getPlayerId() {
        return playerId;
    }

    public String getEventName() {
        return eventName;
    }
}
