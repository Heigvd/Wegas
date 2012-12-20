/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest.exception;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.exception.ConstraintViolationException;
import com.wegas.exception.WegasException;
import java.sql.SQLException;
import java.util.Iterator;
import javax.ejb.EJBException;
import javax.enterprise.event.ObserverException;
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

        if (exception instanceof RollbackException
                || exception instanceof TransactionRolledbackException) {
            return processException(exception.getCause());

        } else if (exception instanceof EJBException) {
            return processException(((EJBException) exception).getCausedByException());

        } else if (exception instanceof org.omg.CORBA.TRANSACTION_ROLLEDBACK) {
            return processException(exception.getCause());

        } else if (exception instanceof DatabaseException) {
            DatabaseException dbe = (DatabaseException) exception;
            return processException(dbe.getInternalException());

        } else if (exception instanceof ObserverException) {
            return processException(exception.getCause());

        } else if (exception instanceof javax.script.ScriptException) {
            logger.error(exception.getLocalizedMessage());
            javax.script.ScriptException scriptException = (javax.script.ScriptException) exception;

            if (scriptException.getCause() instanceof ConstraintViolationException) {
                return processException(scriptException.getCause());
            } else {
                return Response.status(Response.Status.BAD_REQUEST).
                        entity(new ExceptionWrapper("400", scriptException.getClass(), scriptException.getLocalizedMessage())).
                        build();
            }

        } else if (exception instanceof SQLException) {
            logger.error(exception.getLocalizedMessage());
            SQLException sqlException = (SQLException) exception;
            return Response.status(Response.Status.BAD_REQUEST).
                    entity(new ExceptionWrapper("400", sqlException.getClass(), sqlException.getLocalizedMessage())).build();

        } else if (exception instanceof WegasException) {
            logger.error(exception.getLocalizedMessage());
            WegasException wegasException = (WegasException) exception;
            return Response.status(Response.Status.BAD_REQUEST).
                    entity(new ExceptionWrapper("400", wegasException.getClass(), wegasException.getLocalizedMessage())).build();

        } else if (exception instanceof javax.validation.ConstraintViolationException) {
            javax.validation.ConstraintViolationException constraintViolationException = (javax.validation.ConstraintViolationException) exception;

            String msg = RequestFacade.lookup().getBundle("com.wegas.app.errors").getString("constraint"); //internationalised error (sample)
            Iterator it = constraintViolationException.getConstraintViolations().iterator();
            while (it.hasNext()) {
                javax.validation.ConstraintViolation violation = (javax.validation.ConstraintViolation) it.next();
                msg += "\n" + violation.getLeafBean() + ":" + violation.getRootBean() + violation.getPropertyPath();
            }
            logger.error(msg);
            // constraintViolationException.getMessage()
            return Response.status(Response.Status.BAD_REQUEST).
                    entity(new ExceptionWrapper("400", exception.getClass(), constraintViolationException.getLocalizedMessage())).build();

        } else {
            logger.error(RequestFacade.lookup().getBundle("com.wegas.app.errors").getString("unexpected"), exception); //internationalised error (sample)
            return Response.status(Response.Status.BAD_REQUEST).
                    entity(new ExceptionWrapper("400", exception.getClass(), exception.getLocalizedMessage())).build();
        }
    }
}