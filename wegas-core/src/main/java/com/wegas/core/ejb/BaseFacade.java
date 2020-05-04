/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.persistence.AbstractEntity;
import java.util.List;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 *
 * This is the default implementation of the AbstractFacade pattern defined in
 * Wegas, to be extended.
 *
 * @param <T> AbstractEntity subclass to template this facade
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class BaseFacade<T extends AbstractEntity> extends WegasAbstractFacade implements AbstractFacade<T> {

    /**
     * the Class the facade manage
     */
    final Class<T> entityClass;

    /**
     *
     * @param entityClass
     */
    public BaseFacade(final Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    /**
     * EntityManager Flush
     */
    @Override
    public void flush() {
        getEntityManager().flush();
    }

    /**
     * Refresh an entity. Reload it from DB and revert any uncommitted change
     *
     * @param entity the entity to refresh
     */
    public void refresh(final T entity) {
        getEntityManager().flush();
        getEntityManager().refresh(entity);
    }

    /**
     * Detach an entity
     *
     * @param entity the entity to detach
     */
    public void detach(final T entity) {
        getEntityManager().detach(entity);
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
     *
     * @return the very updated entity
     */
    @Override
    public T update(final Long entityId, final T entity) {
        final T oldEntity = this.find(entityId);
        oldEntity.merge(entity);
        return oldEntity;
    }

    /**
     * Merge the given entity
     *
     * @param entity
     *
     * @return the merged entity
     */
    public T merge(final T entity) {
        this.getEntityManager().merge(entity);
        return entity;
    }

    /**
     *
     * Duplicate an entity by cloning it.and {@link AbstractFacade#create} it
     *
     * @param entityId of of entity to duplicate
     *
     * @return a copy of entity identified by entityId,
     */
    @Override
    public T duplicate(final Long entityId) throws CloneNotSupportedException {
        final T newEntity = (T) this.find(entityId).duplicate();
        this.create(newEntity);
        return newEntity;
    }

    /**
     * Destroy entity identify by entityId
     *
     * @param entityId
     */
    @Override
    public void remove(final Long entityId) {
        this.remove(this.find(entityId));
    }

    public void removeAbstractEntity(AbstractEntity entity) {
        this.getEntityManager().remove(entity);
    }

    public void persistAbstractEntity(AbstractEntity entity) {
        this.getEntityManager().persist(entity);
    }

    /**
     *
     * find T instance by id
     *
     * @param entityId id to look for
     *
     * @return entity matching given id
     */
    @Override
    public T find(final Long entityId) {
        return getEntityManager().find(entityClass, entityId);
    }

    /**
     * Find all entities which are instanceof T
     *
     * @return all instances of type T
     */
    @Override
    public List<T> findAll() {
        final CriteriaQuery<T> query = getEntityManager().getCriteriaBuilder().createQuery(entityClass);
        query.select(query.from(entityClass));
        return getEntityManager().createQuery(query).getResultList();
    }

    /**
     * Just like findAll but paginate the output
     *
     * @param range int array containing two elements... it's quite ugly...
     *
     * @return all entities matching the range filter
     *
     * @deprecated
     */
    @Override
    public List<T> findRange(int[] range) {
        final CriteriaQuery<T> query = getEntityManager().getCriteriaBuilder().createQuery(entityClass);
        query.select(query.from(entityClass));
        TypedQuery<T> q = getEntityManager().createQuery(query);
        q.setMaxResults(range[1] - range[0]);
        q.setFirstResult(range[0]);
        return q.getResultList();
    }

    /**
     * How many entity of T type exists ?
     *
     * @return the total number of entity of type T
     */
    @Override
    public int count() {
        final CriteriaQuery<Long> query = getEntityManager().getCriteriaBuilder().createQuery(Long.class);
        final Root<T> rt = query.from(entityClass);
        query.select(getEntityManager().getCriteriaBuilder().count(rt));
        final TypedQuery<Long> q = getEntityManager().createQuery(query);
        try {
            return q.getSingleResult().intValue();
        } catch (NoResultException ex) {
            throw new WegasNotFoundException(ex.getMessage());
        }
    }

    /*
     *
     * @param ic
     * @return intercepted method returned object
     * @throws Exception
     */
 /*@AroundInvoke
    public Object interceptor(final InvocationContext ic) throws Exception {
        Object o = null;
        try {
            o = ic.proceed();
            //if (!sessionContext.getRollbackOnly()) {
            //    entityManager.flush();
            //}
        } catch (NoResultException e) { // NoResultException are caught and wrapped exception
            throw new WegasNotFoundException(e); // so they do not cause transaction rollback
            //throw e;
        }

        return o;
    }*/
}
