/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.rest.util.annotations.CacheMaxAge;
import com.wegas.core.security.rest.UserController;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.DynamicFeature;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.FeatureContext;
import javax.ws.rs.ext.Provider;

/**
 *
 * Feature-dependant CacheResponseFilter according to method or class "NoCache"
 * and "MaxCacheAge" annotations.
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Provider
public class DynamicFilters implements DynamicFeature {

    private static final CacheResponseFilter noCacheNoStoreResponseFilter = new CacheResponseFilter(CacheResponseFilter.NO_CACHE_NO_STORE);

    private static final String private_cache = "private, ";

    @Context
    private HttpServletRequest httpRequestProxy;

    @Override
    public void configure(ResourceInfo resourceInfo, FeatureContext context) {

        /**
         * Cache Max Age Filter
         */
        /*Test method level*/
        CacheMaxAge cma = resourceInfo.getResourceMethod().getAnnotation(CacheMaxAge.class);
        //NoCache nc = resourceInfo.getResourceMethod().getAnnotation(NoCache.class);

        // Max Age set on method -> override all
        if (cma != null) {
            context.register(new CacheResponseFilter(genCacheString(cma)));
        } else {
            // No annotation -> check on class
            cma = resourceInfo.getResourceClass().getAnnotation(CacheMaxAge.class);

            if (cma != null) {
                context.register(new CacheResponseFilter(genCacheString(cma)));
                //} else if (nc != null) {
            } else {
                context.register(noCacheNoStoreResponseFilter);
            }
        }

        /*
         * Detect Deprecated Calls
         */
        Deprecated deprecatedController = resourceInfo.getResourceClass().getAnnotation(Deprecated.class);
        Deprecated deprecatedMethod = resourceInfo.getResourceMethod().getAnnotation(Deprecated.class);

        if (deprecatedController != null || deprecatedMethod != null) {
            context.register(new DeprecationFilter());
        }


        /*
         * Detect guest login
         */
        if (resourceInfo.getResourceClass().equals(UserController.class)
                && resourceInfo.getResourceMethod().getName().equals("guestLogin")) {
            context.register(new GuestTracker(httpRequestProxy));
        }

    }

    /**
     * Compute cache-control string based on annotations.
     *
     * @param cma
     *
     * @return the cache-control string
     */
    private static String genCacheString(CacheMaxAge cma) {
        return (cma.private_cache() ? private_cache : "") + "max-age: " + cma.unit().toSeconds(cma.time());
    }
}
