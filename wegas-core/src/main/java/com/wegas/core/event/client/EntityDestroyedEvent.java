/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class EntityDestroyedEvent extends ClientEvent {
    

    private static final long serialVersionUID = 1L;
    private List<DestroyedEntity> destroyedEntities = new ArrayList<>();

    /**
     *
     */
    public EntityDestroyedEvent() {
    }

    /**
     *
     * @param deletedEntities
     */
    public EntityDestroyedEvent(List<DestroyedEntity> deletedEntities) {
        this.destroyedEntities = deletedEntities;
    }

    /**
     * @return the destroyedEntities
     */
    public List<DestroyedEntity> getDeletedEntities() {
        return destroyedEntities;
    }

    /**
     * @param deletedEntities the destroyedEntities to set
     */
    public void setDeletedEntities(List<DestroyedEntity> deletedEntities) {
        this.destroyedEntities = deletedEntities;
    }

    /**
     *
     * @param vi
     */
    public void addEntity(DestroyedEntity vi) {
        this.destroyedEntities.add(vi);
    }
}
