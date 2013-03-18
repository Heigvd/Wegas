/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event;

import java.io.Serializable;

/**
 *
 * @author Yannick Lagger <lagger.yannick at gmail.com>
 */
public class RequestCommit implements Serializable {

    private EntityUpdatedEvent request;
    
    public RequestCommit(EntityUpdatedEvent request){
        this.request = request;
    }
}
