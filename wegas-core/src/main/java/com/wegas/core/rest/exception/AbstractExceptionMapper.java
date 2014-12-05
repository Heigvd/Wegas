/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.exception;

import javax.ejb.EJBException;
import javax.enterprise.event.ObserverException;
import javax.persistence.PersistenceException;
import javax.transaction.RollbackException;
import javax.transaction.TransactionRolledbackException;
import javax.ws.rs.core.Response;
import org.eclipse.persistence.exceptions.DatabaseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract class AbstractExceptionMapper {

    final static private Logger logger = LoggerFactory.getLogger(AbstractExceptionMapper.class);

    /**
     *
     * @param exception
     * @return
     */
    public static Response processException(Throwable exception) {
        logger.warn("ProcessException: " + exception);

        if (exception instanceof RollbackException
                || exception instanceof TransactionRolledbackException
                || exception instanceof ObserverException
                || exception instanceof PersistenceException
//                || exception instanceof javax.persistence.PersistenceException
                || exception instanceof org.omg.CORBA.TRANSACTION_ROLLEDBACK) {
            return processException(exception.getCause());

        } else if (exception instanceof EJBException) {
            return processException(((EJBException) exception).getCausedByException());

        } else if (exception instanceof DatabaseException) {
            DatabaseException dbe = (DatabaseException) exception;
            return processException(dbe.getInternalException());
        } else {
            logger.error(exception.getLocalizedMessage());
            return Response.status(Response.Status.BAD_REQUEST).entity(exception).build();
        }
        /*} else if (exception instanceof WegasRuntimeException){
            logger.error(exception.getLocalizedMessage());
            return Response.status(Response.Status.BAD_REQUEST).
                    //entity(new ExceptionWrapper("400", exception.getClass(), exception.getLocalizedMessage())).build();
                    entity(exception).build();
        } else if (exception instanceof ConstraintViolationException) {
            ConstraintViolationException constraintViolationException = (ConstraintViolationException) exception;

            StringBuilder sb = new StringBuilder(
                    RequestFacade.lookup().getBundle("com.wegas.app.errors").getString("constraint")); //internationalised error (sample)
            for (javax.validation.ConstraintViolation violation : constraintViolationException.getConstraintViolations()) {
                sb.append("\n").append(violation.getLeafBean()).append(":").append(violation.getRootBean()).append(violation.getPropertyPath());
            }
            logger.error(sb.toString());
            // constraintViolationException.getMessage()
            return Response.status(Response.Status.BAD_REQUEST).
                    entity(new ExceptionWrapper("400", exception.getClass(), constraintViolationException.getLocalizedMessage())).build();
                    //entity(exception).build();
        } else {
            logger.error(RequestFacade.lookup().
                    getBundle("com.wegas.app.errors").getString("unexpected"), exception); //internationalised error (sample)
            return Response.status(Response.Status.BAD_REQUEST).
                    entity(new ExceptionWrapper("400", exception.getClass(), exception.getLocalizedMessage())).build();
        }*/
    }
}
