/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class EntityUpdateEvent {

    private AbstractEntity entity;

    /**
     *
     * @param entity
     */
    public EntityUpdateEvent(AbstractEntity entity) {
        this.entity = entity;
    }

    /**
     *
     * @return
     */
    public AbstractEntity getEntity() {
        return entity;
    }

    @Override
    public String toString() {
        return "EntityUpdateEvent{" + "entity=" + entity + '}';
    }
}
