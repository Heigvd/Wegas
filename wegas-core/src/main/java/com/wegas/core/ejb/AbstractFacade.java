/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.AbstractEntity;
import java.io.IOException;
import java.util.List;

/**
 *
 * @param <T>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface AbstractFacade<T extends AbstractEntity> {

    /**
     *
     * @param entity
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
     * @return
     */
    T update(final Long entityId, final T entity);

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    T duplicate(final Long entityId) throws IOException;

    /**
     *
     * @param entity
     */
    void remove(T entity);

    /**
     *
     * @param id
     */
    void remove(Long id);

    /**
     *
     * @param id
     * @return
     */
    T find(final Long id);

    /**
     *
     * @return
     */
    int count();

    /**
     *
     * @return
     */
    List<T> findAll();

    /**
     *
     * @param range
     * @return
     */
    List<T> findRange(int[] range);

    /**
     *
     */
    void flush();
}
