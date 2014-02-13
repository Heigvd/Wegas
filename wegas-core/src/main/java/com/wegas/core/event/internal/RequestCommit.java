/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.event.client.EntityUpdatedEvent;
import java.io.Serializable;

/**
 *
 * @author Yannick Lagger <lagger.yannick at gmail.com>
 */
public class RequestCommit implements Serializable {

    private EntityUpdatedEvent request;

    public RequestCommit(EntityUpdatedEvent request) {
        this.request = request;
    }
}
