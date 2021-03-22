/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package ch.albasim.wegas.annotations;


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
    default void add(Object child, IMergeable container, Object identifier) {
        // default behaviour do not do anything
    }

    /**
     * Just before entity or field update
     *
     * @param entity
     * @param newValue
     * @param identifier
     */
    default void preUpdate(IMergeable entity, Object newValue, Object identifier) {
        // default behaviour do not do anything
    }

    /**
     * Just after entity or field update
     *
     * @param entity
     * @param ref
     * @param identifier
     */
    default void postUpdate(IMergeable entity, Object ref, Object identifier) {
        // default behaviour do not do anything
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
    default Object remove(Object child, IMergeable container, Object identifier) {
        // default behaviour do not do anything
        return null;
    }

    /**
     * Called after the patch has been completely processed for each branch new entity
     *
     * @param entity
     * @param identifier
     */
    default void persist(IMergeable entity, Object identifier) {
        // default behaviour do not do anything
    }

    /**
     * Called after the patch has been completely processed for each entity which is to be removed
     *
     * @param entity
     * @param identifier
     */
    default void destroy(IMergeable entity, Object identifier) {
        // default behaviour do not do anything
    }

    default void registerOrphans(Object orphans) {
        // default behaviour do not do anything
    }
}
