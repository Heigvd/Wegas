/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.persistence.AnonymousEntity;


import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.PersistenceException;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.xml.bind.annotation.XmlType;
import org.eclipse.persistence.exceptions.DatabaseException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class WegasEntityManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");
    @EJB
    Dispatcher dispatcher;
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    private void processConstraintViolationException(AnonymousEntity ae,
            ConstraintViolationException ex) {

        logger.log(Level.INFO, "ContrainViolationException on {0} [{1}]", new Object[]{ae.getClass().getSimpleName(), ae.getId()});

        ArrayList<String> errors = new ArrayList<String>();
        for (ConstraintViolation c : ex.getConstraintViolations()) {
            logger.log(Level.SEVERE, "Message:      {0}", c.getMessage());
            logger.log(Level.SEVERE, "Descriptor:   {0}", c.getConstraintDescriptor().toString());
            logger.log(Level.SEVERE, "PropertyPath: {0}", c.getPropertyPath());
            XmlType annotation = c.getLeafBean().getClass().getAnnotation(XmlType.class);
            String name = annotation.name();
            logger.log(Level.SEVERE, "Class (json): {0}", name);
            AnonymousEntity leafBean = (AnonymousEntity) c.getLeafBean();
            logger.log(Level.SEVERE, "ID:           {0}", leafBean.getId());
            StringBuilder builder = new StringBuilder();
            builder.append(name);
            builder.append("[");
            builder.append(((AnonymousEntity) c.getLeafBean()).getId());
            builder.append("]");
            builder.append(".");
            builder.append(c.getPropertyPath());
            builder.append(" ");
            builder.append(c.getMessage());
            errors.add(builder.toString());
        }
        ae.setErrors(errors);

        //if (terminal != null) {
        logger.log(Level.INFO, "ROLLBACK after constraint validation error");
        dispatcher.rollback();
        logger.log(Level.INFO, "ROLLBACK done");
        //}
        throw new InvalidContent(ex, ae);
    }

    private void processPersistenceException(AnonymousEntity ae,
            PersistenceException ex) {
        logger.log(Level.INFO, "Persistence Exception");

        ArrayList<String> errors = new ArrayList<String>();

        errors.add("Exception is " + ex.getClass().getSimpleName());

        errors.add(ex.getMessage());

        ae.setErrors(errors);

        Throwable cause = ex.getCause();
        if (cause instanceof DatabaseException) {
            processDatabaseException(ae, (DatabaseException) cause);
        }


        dispatcher.rollback();
        throw new InvalidContent(ex, ae);
    }

    private void processDatabaseException(AnonymousEntity ae,
            DatabaseException ex) {
        logger.log(Level.INFO, "Database Exception");
        List<String> errors = ae.getErrors();
        if (errors == null) {
            errors = new ArrayList<String>();
            ae.setErrors(errors);
        }

        errors.add("Exception is " + ex.getClass().getSimpleName());

        errors.add(ex.getMessage());

        logger.log(Level.INFO, "Accessor: " + ex.getAccessor());
        logger.log(Level.INFO, "ErrorCode: " + ex.getDatabaseErrorCode());
        logger.log(Level.INFO, "Message: " + ex.getMessage());
        logger.log(Level.INFO, "Record: " + ex.getQueryArgumentsRecord());
        logger.log(Level.INFO, "Query: " + ex.getQuery());

        throw new InvalidContent(ex, ae);
    }

    /**
     * Common method that persist the provided entity
     * 
     * @todo error management !
     * 
     * @param ae 
     */
    public void create(AnonymousEntity ae) {
        try {
            em.persist(ae);
            flush();
                commit();
        } catch (PersistenceException ex) {
            processPersistenceException(ae, ex);
        } catch (ConstraintViolationException ex) {
            processConstraintViolationException(ae, ex);
        } catch (RuntimeException ex) {
            logger.log(Level.INFO, "RuntimeException: " + ex);
            dispatcher.rollback();
            throw new InvalidContent(ex, ae);
        }
    }

    /**
     * Common method that propagateUpdate the provided entity
     * @param ae 
     */
    public <T extends AnonymousEntity> T update(T ae) {
        try {
            T merge = em.merge(ae);
            flush();

            em.refresh(merge);

            dispatcher.update(merge);

            commit();
            return merge;

        } catch (PersistenceException ex) {
            processPersistenceException(ae, ex);
        } catch (ConstraintViolationException ex) {
            processConstraintViolationException(ae, ex);
        }
        return null;
    }

    /**
     * Destroy an entity 
     * 
     * @param entity  the entity to propagateDestroy
     */
    public void destroy(Object entity) {
        em.remove(entity);
        flush();
        commit();
    }

    /**
     * Flushing changes make sure validation exceptions are thrown as soon as possible !
     */
    private void flush() {
        em.flush();
    }

    private void commit() {
        dispatcher.commit();
    }
}