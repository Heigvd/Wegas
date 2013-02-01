/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
    public void create(T entity);

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
    public T update(final Long entityId, final T entity);

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    public T duplicate(final Long entityId) throws IOException;

    /**
     *
     * @param entity
     */
    public void remove(T entity);

    /**
     *
     * @param id
     */
    public void remove(Long id);

    /**
     *
     * @param id
     * @return
     */
    public T find(final Long id);

    /**
     *
     * @return
     */
    public int count();

    /**
     *
     * @return
     */
    public List<T> findAll();

    /**
     *
     * @param range
     * @return
     */
    public List<T> findRange(int[] range);

    /**
     *
     */
    public void flush();
}
