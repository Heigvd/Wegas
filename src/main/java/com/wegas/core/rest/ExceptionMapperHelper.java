/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import java.sql.SQLException;
import javax.transaction.RollbackException;
import javax.transaction.TransactionRolledbackException;
import javax.ws.rs.core.Response;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.eclipse.persistence.exceptions.DatabaseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract class ExceptionMapperHelper {

    final static private Logger logger = LoggerFactory.getLogger(ExceptionMapperHelper.class);

    public static Response processException(Throwable exception) {


        if (exception instanceof RollbackException) {
            return ExceptionMapperHelper.processException(exception.getCause());

        } else if (exception instanceof TransactionRolledbackException) {
            return ExceptionMapperHelper.processException(exception.getCause());

        } else if (exception instanceof DatabaseException) {
            DatabaseException dbe = (DatabaseException) exception;
            return ExceptionMapperHelper.processException(dbe.getInternalException());
            
        } else if (exception instanceof SQLException) {
            SQLException sqlException = (SQLException) exception;
            return Response.status(
                    Response.Status.BAD_REQUEST).entity(
                    new ExceptionMapperHelper.RestExceptionConverter("400", sqlException.getClass(), sqlException.getLocalizedMessage())).build();

        } else {
            return Response.status(
                    Response.Status.BAD_REQUEST).entity(
                    new ExceptionMapperHelper.RestExceptionConverter("400", exception.getClass(), exception.getLocalizedMessage())).build();

        }
    }

    @XmlRootElement
    @XmlType(name = "RestException")
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
    private static class RestExceptionConverter {

        private String code;
        private Class exception;
        private String message;

        public RestExceptionConverter(String code, Class exception, String message) {
            this.code = code;
            this.exception = exception;
            this.message = message;
        }

        /**
         * @return the code
         */
        public String getCode() {
            return code;
        }

        /**
         * @param code the code to set
         */
        public void setCode(String code) {
            this.code = code;
        }

        /**
         * @return the exception
         */
        public Class getException() {
            return exception;
        }

        /**
         * @param exception the exception to set
         */
        public void setException(Class exception) {
            this.exception = exception;
        }

        /**
         * @return the message
         */
        public String getMessage() {
            return message;
        }

        /**
         * @param message the message to set
         */
        public void setMessage(String message) {
            this.message = message;
        }
    }
}