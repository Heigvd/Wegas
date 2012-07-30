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

import javax.servlet.ServletException;
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
public class ServletExceptionMapper extends AbstractExceptionMapper
        implements ExceptionMapper<ServletException> {

    final private Logger logger = LoggerFactory.getLogger(ServletException.class);

    /**
     *
     * @param exception
     * @return
     */
    @Override
    public Response toResponse(ServletException exception) {
        return processException(exception.getCause());
    }
}