/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.event.client.EntityUpdatedEvent;
import java.io.Serializable;

/**
 *
 * @author Yannick Lagger <lagger.yannick at gmail.com>
 * @deprecated 
 */
public class RequestCommit implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     *
     * @param request
     */
    public RequestCommit(EntityUpdatedEvent request) {
        EntityUpdatedEvent request1 = request;
    }
}
