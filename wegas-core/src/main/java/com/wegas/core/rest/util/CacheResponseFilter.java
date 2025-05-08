/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import java.io.IOException;
import java.util.List;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.HttpHeaders;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class CacheResponseFilter implements ContainerResponseFilter {

    private final static Logger logger = LoggerFactory.getLogger(CacheResponseFilter.class);

    /**
     *
     */
    public static final String NO_CACHE_NO_STORE = "no-cache, no-store, must-revalidate";
    private final String headers;

    /**
     *
     * @param headers
     */
    protected CacheResponseFilter(String headers) {
        this.headers = headers;
    }

    /**
     *
     */
    public CacheResponseFilter() {
        /*Default to no-cache as most clients have this behaviour*/
        this.headers = NO_CACHE_NO_STORE;
    }

    /**
     *
     * @param request
     * @param response
     *
     * @throws java.io.IOException
     */
    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) throws IOException {
        List<Object> cc = response.getHeaders().get(HttpHeaders.CACHE_CONTROL);
        if (cc == null || cc.isEmpty()) {
            logger.trace("Set CacheControl to {}", headers);
            response.getHeaders().putSingle(HttpHeaders.CACHE_CONTROL, headers);
        }
    }

}
