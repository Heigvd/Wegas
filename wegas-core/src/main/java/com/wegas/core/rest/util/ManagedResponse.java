/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.core.rest.util;
 
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;


/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class ManagedResponse {

    private List<AbstractEntity> entities;
    private List<ClientEvent> events;

    public ManagedResponse() {
        this.events = new ArrayList<>();
        this.entities = new ArrayList<>();
    }
    /**
     * @return the entities
     */
    /**
     * @param entities the entities to set
     */
    /**
     * @return the events
     */
    /**
     * @param events the events to set
     */

    /**
     * @return the entities
     */
    public List<AbstractEntity> getEntities() {
        return entities;
    }

    /**
     * @param entities the entities to set
     */
    public void setEntities(List<AbstractEntity> entities) {
        this.entities = entities;
    }

    /**
     * @return the events
     */
    public List<ClientEvent> getEvents() {
        return events;
    }

    /**
     * @param events the events to set
     */
    public void setEvents(List<ClientEvent> events) {
        this.events = events;
    }
}
