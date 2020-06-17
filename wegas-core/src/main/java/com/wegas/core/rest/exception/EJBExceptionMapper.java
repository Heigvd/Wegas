/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.exception;

import javax.ejb.EJBException;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Provider
public class EJBExceptionMapper extends AbstractExceptionMapper
        implements ExceptionMapper<EJBException> {

    final private Logger logger = LoggerFactory.getLogger(EJBExceptionMapper.class);

    /**
     *
     * @param exception exception to process
     * @return a HTTP response which wrap the exception
     */
    @Override
    public Response toResponse(EJBException exception) {
        logger.error("EJB EXCEPTION MAPPER");
        return processException(exception.getCause());
    }
}
