/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.AbstractEntity;
import java.io.IOException;
import java.util.List;
import javax.interceptor.AroundInvoke;
import javax.interceptor.InvocationContext;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 *
 * @param <T>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract class AbstractFacadeImpl<T extends AbstractEntity> implements AbstractFacade<T> {

    /**
     *
     */
    final Class<T> entityClass;

    /**
     *
     * @param entityClass
     */
    public AbstractFacadeImpl(final Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    /**
     *
     * @return
     */
    protected abstract EntityManager getEntityManager();

    /**
     *
     */
    @Override
    public void flush() {
        getEntityManager().flush();
    }

    /**
     *
     * @param entity
     */
    @Override
    public void create(final T entity) {
        getEntityManager().persist(entity);
        // getEntityManager().flush();
    }

//    /**
//     *
//     * @param entity
//     */
//    @Override
//    public void edit(final T entity) {
//        getEntityManager().merge(entity);
//    }
    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    @Override
    public T update(final Long entityId, final T entity) {
        final T oldEntity = this.find(entityId);
        oldEntity.merge(entity);
        return oldEntity;
    }

    /**
     *
     * Duplicate an entity by serializing it using the "Editor" view and
     * serializing it back.
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @Override
    public T duplicate(final Long entityId) throws IOException {
        final T oldEntity = this.find(entityId);                                      // Retrieve the entity to duplicate
        final T newEntity = (T) oldEntity.duplicate();
        this.create(newEntity);                                                 // Store it in db
        return newEntity;
    }

    /**
     *
     * @param entity
     */
    @Override
    public void remove(final T entity) {
        getEntityManager().remove(entity);
    }

    /**
     *
     * @param id
     */
    @Override
    public void remove(final Long entityId) {
        this.remove(this.find(entityId));
    }

    /**
     *
     * @param id
     * @return
     */
    @Override
    public T find(final Long entityId) {
        return getEntityManager().find(entityClass, entityId);
    }

    /**
     *
     * @return
     */
    @Override
    public List<T> findAll() {
        final CriteriaQuery query = getEntityManager().getCriteriaBuilder().createQuery();
        query.select(query.from(entityClass));
        return getEntityManager().createQuery(query).getResultList();
    }

    /**
     *
     * @param range
     * @return
     */
    @Override
    public List<T> findRange(int[] range) {
        final CriteriaQuery query = getEntityManager().getCriteriaBuilder().createQuery();
        query.select(query.from(entityClass));
        Query q = getEntityManager().createQuery(query);
        q.setMaxResults(range[1] - range[0]);
        q.setFirstResult(range[0]);
        return q.getResultList();
    }

    /**
     *
     * @return
     */
    @Override
    public int count() {
        final CriteriaQuery query = getEntityManager().getCriteriaBuilder().createQuery();
        final Root<T> rt = query.from(entityClass);
        query.select(getEntityManager().getCriteriaBuilder().count(rt));
        final Query q = getEntityManager().createQuery(query);
        return ((Long) q.getSingleResult()).intValue();
    }

    /**
     *
     * @param ic
     * @return
     * @throws Exception
     */
    @AroundInvoke
    public Object interceptor(final InvocationContext ic) throws Exception {
        Object o = null;
        try {
            o = ic.proceed();
            //if (!sessionContext.getRollbackOnly()) {
            //    entityManager.flush();
            //}
        } catch (NoResultException e) {                                         // NoResultException are caught and wrapped exception
            throw new com.wegas.core.exception.NoResultException(e);            // so they do not cause transaction rollback
            //throw e;
        }

        return o;
    }
}
