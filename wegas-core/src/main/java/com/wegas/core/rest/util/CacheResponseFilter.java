/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import java.io.IOException;
import java.util.List;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.HttpHeaders;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class CacheResponseFilter implements ContainerResponseFilter {
    /**
     *
     */
    public static final String NO_CACHE = "no-cache, no-store, must-revalidate";
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
        this.headers = NO_CACHE;
    }

    /**
     *
     * @param request
     * @param response
     * @throws java.io.IOException
     */
    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) throws IOException {
        List<Object> cc = response.getHeaders().get(HttpHeaders.CACHE_CONTROL);
        if (cc == null || cc.isEmpty()) {
            response.getHeaders().putSingle(HttpHeaders.CACHE_CONTROL, headers);
        }
    }

}
