/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponse;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import java.util.List;
import javax.ws.rs.core.HttpHeaders;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class CacheResponseFilter implements ResourceFilter, ContainerResponseFilter {

    private final String headers;

    protected CacheResponseFilter(String headers) {
        this.headers = headers;
    }

    public CacheResponseFilter() {
        /*Default to no-cache as most clients have this behaviour*/
        this.headers = "no-cache";
    }

    @Override
    public ContainerRequestFilter getRequestFilter() {
        return null;
    }

    @Override
    public ContainerResponseFilter getResponseFilter() {
        return this;
    }

    @Override
    public ContainerResponse filter(ContainerRequest request, ContainerResponse response) {
        List<Object> cc = response.getHttpHeaders().get(HttpHeaders.CACHE_CONTROL);
        if (cc != null && cc.size() > 0) {
            /* CC set */
            return response;
        }

        response.getHttpHeaders().putSingle(HttpHeaders.CACHE_CONTROL, headers);
        return response;
    }

}
