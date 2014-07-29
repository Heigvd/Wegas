/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.rest.util.annotations.CacheMaxAge;
import com.wegas.core.rest.util.annotations.NoCache;
import javax.ws.rs.container.DynamicFeature;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.FeatureContext;
import javax.ws.rs.ext.Provider;

/**
 * 
 * Feature-dependant CacheResponseFilter according to method or class "NoCache" and "MaxCacheAge"
 * annotations.
 * 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Provider
public class DynamicCacheFilters implements DynamicFeature {

    private static final CacheResponseFilter noCacheResponseFilter = new CacheResponseFilter(CacheResponseFilter.NO_CACHE);
    private static final String private_cache = "private, ";

    @Override
    public void configure(ResourceInfo resourceInfo, FeatureContext context) {

        /*Test method level*/
        CacheMaxAge cma = resourceInfo.getResourceMethod().getAnnotation(CacheMaxAge.class);
        NoCache nc = resourceInfo.getResourceMethod().getAnnotation(NoCache.class);

        if (cma != null) {
            context.register(new CacheResponseFilter(genCacheString(cma)));
        } else if (nc != null) {
            context.register(noCacheResponseFilter);
        }

        cma = resourceInfo.getResourceClass().getAnnotation(CacheMaxAge.class);
        nc = resourceInfo.getResourceMethod().getAnnotation(NoCache.class);

        if (cma != null) {
            context.register(new CacheResponseFilter(genCacheString(cma)));
        } else if (nc != null) {
            context.register(noCacheResponseFilter);
        }

    }

    /**
     * Compute cache-control string based on annotations.
     *
     * @param cma
     * @return
     */
    private static String genCacheString(CacheMaxAge cma) {
        return (cma.private_cache() ? private_cache : "") + "max-age: " + cma.unit().toSeconds(cma.time());
    }
}
