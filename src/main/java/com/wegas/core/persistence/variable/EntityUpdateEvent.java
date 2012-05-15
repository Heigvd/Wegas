/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
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
