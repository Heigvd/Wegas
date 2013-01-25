/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import java.io.IOException;
import java.util.List;
import javax.interceptor.AroundInvoke;
import javax.interceptor.InvocationContext;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import org.codehaus.jackson.map.ObjectMapper;

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
    public void create(T entity) {
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
        T oldEntity = this.find(entityId);
        oldEntity.merge(entity);
        return oldEntity;
    }

    /**
     *
     * Duplicate an entity by serialising it using the "Editor" view and
     * serializing it back.
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @Override
    public T duplicate(final Long entityId) throws IOException {

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance

        T oldEntity = this.find(entityId);                                      // Retrieve the entity to duplicate

        String serialized = mapper.writerWithView(Views.Export.class).writeValueAsString(oldEntity);                                 // Serilize the entity
        T newEntity = (T) mapper.readValue(serialized, AbstractEntity.class);   // and deserialize it

        this.create(newEntity);                                                 // Store it db
        return newEntity;
    }

    /**
     *
     * @param entity
     */
    @Override
    public void remove(T entity) {
        getEntityManager().remove(getEntityManager().merge(entity));
    }

    /**
     *
     * @param id
     */
    @Override
    public void remove(final Long id) {
        getEntityManager().remove(this.find(id));
    }

    /**
     *
     * @param id
     * @return
     */
    @Override
    public T find(final Long id) {
        return getEntityManager().find(entityClass, id);
    }

    /**
     *
     * @return
     */
    @Override
    public List<T> findAll() {
        CriteriaQuery cq =
                getEntityManager().getCriteriaBuilder().createQuery();
        cq.select(cq.from(entityClass));
        return getEntityManager().createQuery(cq).getResultList();
    }

    /**
     *
     * @param range
     * @return
     */
    @Override
    public List<T> findRange(int[] range) {
        CriteriaQuery cq =
                getEntityManager().getCriteriaBuilder().createQuery();
        cq.select(cq.from(entityClass));
        Query q = getEntityManager().createQuery(cq);
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
        CriteriaQuery cq = getEntityManager().getCriteriaBuilder().createQuery();
        Root<T> rt = cq.from(entityClass);
        cq.select(getEntityManager().getCriteriaBuilder().count(rt));
        Query q = getEntityManager().createQuery(cq);
        return ((Long) q.getSingleResult()).intValue();
    }

    /**
     *
     * @param ic
     * @return
     * @throws Exception
     */
    @AroundInvoke
    public Object interceptor(InvocationContext ic) throws Exception {
        Object o = null;
        try {
            o = ic.proceed();
            //if (!sessionContext.getRollbackOnly()) {
            //    entityManager.flush();
            //}
        } catch (NoResultException e) {                                           // NoResultException are caught and wrapped exception
            throw new PersistenceException(e);                                  // so they do not cause transaction rollback
            //throw e;
        }

        return o;
    }
}
