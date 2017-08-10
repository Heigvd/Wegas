/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class DeprecationFilter implements ContainerRequestFilter {

    /**
     *
     * @param request
     */
    @Override
    public void filter(ContainerRequestContext request) {
        RequestFacade rmf = RequestFacade.lookup();

        Logger logger = LoggerFactory.getLogger(DeprecationFilter.class);
        String msg = "The requested endpoint (" + request.getMethod() + " /" + request.getUriInfo().getPath() + ") has been deprecated and will be removed in the future";
        rmf.getRequestManager().addException(WegasErrorMessage.warn(msg));
        logger.warn(msg);
    }
}
