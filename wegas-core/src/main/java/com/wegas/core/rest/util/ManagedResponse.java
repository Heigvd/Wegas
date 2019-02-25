/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.DestroyedEntity;
import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class ManagedResponse {

    private List<DestroyedEntity> deletedEntities;
    private List<AbstractEntity> updatedEntities;
    private List<ClientEvent> events;

    public ManagedResponse() {
        this.events = new ArrayList<>();
        this.deletedEntities = new ArrayList<>();
        this.updatedEntities = new ArrayList<>();
    }

    /**
     *
     * @return all entities that have been destroyed during the request
     */
    public List<DestroyedEntity> getDeletedEntities() {
        return deletedEntities;
    }

    /**
     *
     * @param deletedEntities
     */
    public void setDeletedEntities(List<AbstractEntity> deletedEntities) {
        this.deletedEntities.clear();
        for (AbstractEntity entity: deletedEntities){
            this.deletedEntities.add(new DestroyedEntity(entity));
        }
    }

    /**
     *
     * @return all entities that have been updated during the request
     */
    public List<AbstractEntity> getUpdatedEntities() {
        return updatedEntities;
    }

    /**
     *
     * @param updatedEntities
     */
    public void setUpdatedEntities(List<AbstractEntity> updatedEntities) {
        this.updatedEntities = updatedEntities;
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
