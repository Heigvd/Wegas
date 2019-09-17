/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.Helper;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class GuestTracker implements ContainerRequestFilter {

    private HttpServletRequest httpRequest;

    private static Logger logger = LoggerFactory.getLogger(GuestTracker.class);

    public GuestTracker(HttpServletRequest httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     *
     * @param request
     */
    @Override
    public void filter(ContainerRequestContext request) {
        logger.info("New Guest Login ({}) from {}", request.getHeaderString("user-agent"), Helper.getRequestingIP(httpRequest));
    }
}
