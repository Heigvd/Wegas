/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.Mergeable;

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
     * @param child      added entity
     * @param container  list/map which contains the new entity
     * @param identifier entity identifier (map key or position in list)
     */
    default public void add(Object child, Mergeable container, Object identifier) {

    }

    /**
     * Just before entity or field update
     *
     * @param entity
     * @param newValue
     * @param identifier
     */
    default public void preUpdate(Mergeable entity, Object newValue, Object identifier) {

    }

    /**
     * Just after entity or field update
     *
     * @param entity
     * @param ref
     * @param identifier
     */
    default public void postUpdate(Mergeable entity, Object ref, Object identifier) {

    }

    /**
     * Called when an entity is removed or when a child is removed from its parent
     *
     * @param child      the child to remove from container
     * @param container  container to remove child from
     * @param identifier child identifier
     *
     * @return child key (key for map and idx for list), null if nothing was removed
     */
    default public Object remove(Object child, Mergeable container, Object identifier) {
        return null;
    }

    /**
     * Called after the patch has been completely processed for each branch new entity
     *
     * @param entity
     * @param identifier
     */
    default public void persist(Mergeable entity, Object identifier) {

    }

    /**
     * Called after the patch has been completely processed for each entity which is to be removed
     *
     * @param entity
     * @param identifier
     */
    default public void destroy(Mergeable entity, Object identifier) {

    }

    default public void registerOrphans(Object orphans) {
    }
}
