/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.exception;

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
public class DefaultExceptionMapper extends AbstractExceptionMapper
        implements ExceptionMapper<Exception> {

    final private Logger logger = LoggerFactory.getLogger(DefaultExceptionMapper.class);

    /**
     *
     * @param exception
     * @return processed exception
     */
    @Override
    public Response toResponse(Exception exception) {
        logger.error("DEFAULT EXCEPTION MAPPER");
        return processException(exception);
    }
}
