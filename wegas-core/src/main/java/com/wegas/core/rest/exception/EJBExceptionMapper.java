/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Provider
public class EJBExceptionMapper extends AbstractExceptionMapper
        implements ExceptionMapper<EJBException> {

    final private Logger logger = LoggerFactory.getLogger(EJBExceptionMapper.class);

    /**
     *
     * @param exception
     * @return
     */
    @Override
    public Response toResponse(EJBException exception) {
        return processException(exception.getCause());
    }
}