/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.AbstractEntity;
import java.util.List;

/**
 *
 * @param <T>
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public interface AbstractFacade<T extends AbstractEntity> {

    /**
     * persists a new T instance
     *
     * @param entity entity to persist
     */
    void create(T entity);

    /**
     *
     * @param entity
     */
//    public void edit(final T entity);
    /**
     *
     * @param entityId
     * @param entity
     * @return updated entity
     */
    T update(final Long entityId, final T entity);

    /**
     *
     * @param entityId
     * @return entity copy
     * @throws java.lang.CloneNotSupportedException
     */
    T duplicate(final Long entityId) throws CloneNotSupportedException;

    /**
     * Destroy the given entity
     *
     * @param entity
     */
    void remove(T entity);

    /**
     * destroy entity identified by id
     *
     * @param id id of the entity to destroy
     */
    void remove(Long id);

    /**
     * find T instance by id
     *
     * @param id id to look for
     * @return entity matching given id
     */
    T find(final Long id);

    /**
     * How many entity of T type exists ?
     *
     * @return the total number of entity of type T
     */
    int count();

    /**
     *
     * Find all entities which are instanceof T
     *
     * @return all instances of type T
     */
    List<T> findAll();

    /**
     *
     * Just like findAll but paginate the output
     *
     * @param range int array containing two elements... it's quite ugly...
     * @return all entities matching the range filter
     * @deprecated 
     */
    @Deprecated
    List<T> findRange(int[] range);

    /**
     * EntityManager Flush
     */
    void flush();
}
