/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.AbstractEntity;

/**
 *
 * Define some callback called during the patch process
 *
 * @author maxence
 */
public interface WegasCallback {

    /**
     * Called when an entity is created or when a child is added to its parent
     *
     * @param entity     added entity
     * @param container  entity parent
     * @param identifier entity identifier
     */
    default public void add(AbstractEntity entity, Object container, Object identifier) {

    }

    /**
     * Just before entity or field update
     *
     * @param entity
     * @param newValue
     * @param identifier
     */
    default public void preUpdate(AbstractEntity entity, Object newValue, Object identifier) {

    }

    /**
     * Just after entity or field update
     *
     * @param entity
     * @param ref
     * @param identifier
     */
    default public void postUpdate(AbstractEntity entity, Object ref, Object identifier) {

    }

    /**
     * Called when an entity is removed or when a child is removed from its parent
     *
     * @param entity
     * @param identifier
     */
    default public void remove(AbstractEntity entity, Object container, Object identifier) {

    }

    /**
     * Called after the patch has been completely processed for each branch new entity
     *
     * @param entity
     * @param identifier
     */
    default public void persist(AbstractEntity entity, Object identifier) {

    }

    /**
     * Called after the patch has been completely processed for each entity which is to be removed
     *
     * @param entity
     * @param identifier
     */
    default public void destroy(AbstractEntity entity, Object identifier) {

    }
}
