/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
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
    private final long accountId;
    private final String eventName;

    public DelayedEventPayload(long playerId, long accountId, String eventName) {
        this.playerId = playerId;
        this.eventName = eventName;
        this.accountId = accountId;
    }

    public long getPlayerId() {
        return playerId;
    }

    public long getAccountId(){
        return accountId;
    }

    public String getEventName() {
        return eventName;
    }
}
