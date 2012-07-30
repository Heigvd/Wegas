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

import javax.script.ScriptException;
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
public class ScriptExceptionMapper extends AbstractExceptionMapper
        implements ExceptionMapper<ScriptException> {

    final private Logger logger = LoggerFactory.getLogger(ScriptExceptionMapper.class);

    /**
     *
     * @param exception
     * @return
     */
    @Override
    public Response toResponse(ScriptException exception) {
        return processException(exception);
    }
}