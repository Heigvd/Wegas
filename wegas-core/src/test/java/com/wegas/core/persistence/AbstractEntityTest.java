/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.TestHelper;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.Context;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.Persistence;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

/**
 * CRUD testunit for Entities (Integration test)<br/> Setup embedded-glassfish
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public abstract class AbstractEntityTest<T extends AbstractEntity> {

    private static EntityManager em;

    private static EntityManagerFactory emf;

    protected static EntityTransaction tx;

    private static EJBContainer ejbContainer;

    private static Context ctx;

    private Class<T> entityClass;

    public AbstractEntityTest(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    @BeforeClass
    public static void initContext() throws Exception {
        System.out.println("[WeGAS Entity Test] Set up context...");
        ejbContainer = TestHelper.getEJBContainer();
        ctx = ejbContainer.getContext();
        emf = Persistence.createEntityManagerFactory("wegasPU");
        em = emf.createEntityManager();
    }

    @AfterClass
    public static void closeContext() throws Exception {
        System.out.println("[WeGAS Entity Test] ...Clean context");
        TestHelper.closeContainer();
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
