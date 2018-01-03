/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import javax.persistence.PersistenceContext;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import org.junit.Before;

/**
 * CRUD testunit for Entities (Integration test)<br/> Setup embedded-glassfish
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public abstract class AbstractEntityTest<T extends AbstractEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private static EntityManager em;

    protected static EntityTransaction tx;

    private Class<T> entityClass;

    public AbstractEntityTest(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    @Before
    public void initTransaction() {
        tx = em.getTransaction();
    }

    // @Test
    public void delete() throws InstantiationException, IllegalAccessException {
        System.out.println("[WeGAS Entity Test] delete [" + entityClass.getSimpleName() + "]");
        try {
            T entity = entityClass.newInstance();
            tx.begin();
            em.persist(entity);
            tx.commit();
            Long id = entity.getId();
            entity = em.find(entityClass, id);
            tx.begin();
            em.remove(entity);
            tx.commit();
            entity = em.find(entityClass, id);
            assertNull(entity);
        } catch (InstantiationException | IllegalAccessException e) {
            throw e;
        }
    }

    // @Test
    public void update() throws InstantiationException, IllegalAccessException {
        System.out.println("[WeGAS Entity Test] Update [" + entityClass.getSimpleName() + "]");
        this.merge();
    }

    // @Test
    public void read() throws IllegalAccessException, InstantiationException {
        System.out.println("[WeGAS Entity Test] Read [" + entityClass.getSimpleName() + "]");
        try {
            T entity = entityClass.newInstance();
            tx.begin();
            em.persist(entity);
            tx.commit();
            Long id = entity.getId();
            entity = em.find(entityClass, id);
            assertNotNull(entity);
        } catch (InstantiationException | IllegalAccessException e) {
            throw e;
        }
    }

    //  @Test
    public void create() throws IllegalAccessException, InstantiationException {
        System.out.println("[WeGAS Entity Test] Create [" + entityClass.getSimpleName() + "]");
        try {
            T entity = entityClass.newInstance();
            tx.begin();
            em.persist(entity);
            tx.commit();

            assertNotNull(entity.getId());
        } catch (InstantiationException | IllegalAccessException e) {
            throw e;
        }
    }

    protected EntityManager getEm() {

        return this.em;
    }

    /**
     * merge method to implement in test class
     */
    abstract public void merge();
}
