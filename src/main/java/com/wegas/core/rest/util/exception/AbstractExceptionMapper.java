/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest.util.exception;

import java.sql.SQLException;
import java.util.Iterator;
import javax.ejb.EJBException;
import javax.transaction.RollbackException;
import javax.transaction.TransactionRolledbackException;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
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

        if (exception instanceof RollbackException
                || exception instanceof TransactionRolledbackException) {
            return processException(exception.getCause());

        } else if (exception instanceof EJBException) {
            return processException(( (EJBException) exception ).getCausedByException());

        } else if (exception instanceof org.omg.CORBA.TRANSACTION_ROLLEDBACK
                || exception instanceof javax.script.ScriptException) {
            return processException(exception.getCause());

        } else if (exception instanceof DatabaseException) {
            DatabaseException dbe = (DatabaseException) exception;
            return processException(dbe.getInternalException());

        } else if (exception instanceof SQLException) {
            SQLException sqlException = (SQLException) exception;
            return Response.status(
                    Response.Status.BAD_REQUEST).entity(
                    new ExceptionWrapper("400", sqlException.getClass(), sqlException.getLocalizedMessage())).build();

        } else if (exception instanceof ConstraintViolationException) {
            ConstraintViolationException constraintViolationException = (ConstraintViolationException) exception;

            String msg = "Constraint violation: ";
            Iterator it = constraintViolationException.getConstraintViolations().iterator();
            while (it.hasNext()) {
                ConstraintViolation violation = (ConstraintViolation) it.next();
                msg += "\n" + violation.getLeafBean() + ":" + violation.getRootBean() + violation.getPropertyPath();
            }
            logger.error(msg);
            // constraintViolationException.getMessage()
            return Response.status(
                    Response.Status.BAD_REQUEST).entity(
                    new ExceptionWrapper("400", exception.getClass(), constraintViolationException.getLocalizedMessage())).build();

        } else {
            logger.error("Caught an unexpected error: {}", exception.getLocalizedMessage());
            return Response.status(
                    Response.Status.BAD_REQUEST).entity(
                    new ExceptionWrapper("400", exception.getClass(), exception.getLocalizedMessage())).build();
        }
    }
}