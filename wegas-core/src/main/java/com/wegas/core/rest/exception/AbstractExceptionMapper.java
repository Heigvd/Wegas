/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.exception;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasConflictException;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasUniqueConstraintException;
import java.sql.SQLException;
import javax.ejb.EJBException;
import javax.enterprise.event.ObserverException;
import javax.persistence.OptimisticLockException;
import javax.persistence.PersistenceException;
import javax.transaction.RollbackException;
import javax.transaction.TransactionRolledbackException;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.ws.rs.core.Response;
import org.eclipse.persistence.exceptions.DatabaseException;
import org.postgresql.util.PSQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class AbstractExceptionMapper {

    final static private Logger logger = LoggerFactory.getLogger(AbstractExceptionMapper.class);

    /**
     * Unstack exceptions to get rid of interning uninteresting layers and embed
     * result within such a HTTP Bad Request response
     *
     * @param exception
     *
     * @return HTTP BadRequest
     */
    public static Response processException(Throwable exception) {
        logger.trace("ProcessException: {}", exception);

        if (exception instanceof OptimisticLockException) {
            OptimisticLockException ex = (OptimisticLockException) exception;

            logger.error("Try to update outdated: {}", ex.getEntity());
            if (ex.getCause() instanceof org.eclipse.persistence.exceptions.OptimisticLockException) {
                return processException(ex.getCause());
            }

            return Response.status(Response.Status.CONFLICT).entity(new WegasConflictException(exception)).build();
        } else if (exception instanceof org.eclipse.persistence.exceptions.OptimisticLockException) {
            org.eclipse.persistence.exceptions.OptimisticLockException ex = (org.eclipse.persistence.exceptions.OptimisticLockException) exception;
            logger.error("Query: {}", ex.getQuery());
            return Response.status(Response.Status.CONFLICT).entity(new WegasConflictException(ex)).build();

        } else if (exception instanceof RollbackException
                || exception instanceof TransactionRolledbackException
                || exception instanceof ObserverException
                || exception instanceof PersistenceException
                //                || exception instanceof javax.persistence.PersistenceException
                || exception instanceof org.omg.CORBA.TRANSACTION_ROLLEDBACK) {
            return processException(exception.getCause());

        } else if (exception instanceof EJBException) {
            return processException(((EJBException) exception).getCausedByException());

        } else if (exception instanceof PSQLException) {
            PSQLException pex = (PSQLException) exception;
            if (pex.getSQLState().equals("23505")) {
                return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(new WegasUniqueConstraintException(Helper.prettyPrintPSQLException(pex)))
                    .build();
            } else {
                return Response.status(Response.Status.BAD_REQUEST).entity(pex).build();
            }
        } else if (exception instanceof DatabaseException) {
            DatabaseException dbe = (DatabaseException) exception;
            return processException(dbe.getInternalException());
        } else if (exception instanceof ConstraintViolationException) {
            ConstraintViolationException cve = (ConstraintViolationException) exception;
            StringBuilder sb = new StringBuilder();
            for (ConstraintViolation<?> cv : cve.getConstraintViolations()) {
                sb.append(cv.getMessage());
            }
            return Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage.error(sb.toString())).build();
        } else if (exception instanceof SQLException && ((SQLException) exception).getNextException() != null) {
            return processException(((SQLException) exception).getNextException());
        } else {
            if (exception != null) {
                logger.error(exception.getLocalizedMessage());
            } else {
                logger.error("Exception is NULL !!!");
            }
            return Response.status(Response.Status.BAD_REQUEST).entity(exception).build();
        }
    }
}
