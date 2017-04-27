/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.AbstractEntity;
import java.io.Serializable;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @param <T>
 */
public abstract class EntityRevivedEvent<T extends AbstractEntity> implements Serializable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private T entity;

    /**
     *
     */
    public EntityRevivedEvent() {
    }

    /**
     *
     * @param entity
     */
    public EntityRevivedEvent(T entity) {
        this.entity = entity;
    }

    /**
     * @return the entity
     */
    public T getEntity() {
        return entity;
    }

    /**
     * @param entity the entity to set
     */
    public void setEntity(T entity) {
        this.entity = entity;
    }
}
