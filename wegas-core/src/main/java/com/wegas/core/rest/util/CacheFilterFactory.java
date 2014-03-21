/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.spi.container.ResourceFilter;
import com.sun.jersey.spi.container.ResourceFilterFactory;
import com.wegas.core.rest.util.annotations.CacheMaxAge;
import com.wegas.core.rest.util.annotations.NoCache;
import java.util.Collections;
import java.util.List;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class CacheFilterFactory implements ResourceFilterFactory {

    private static final CacheResponseFilter noCacheResponseFilter = new CacheResponseFilter(CacheResponseFilter.NO_CACHE);
    private static final String private_cache = "private, ";

    /**
     * Filter jersey resources and add a filter to CacheMaxAge and NoCache
     * annotated functions.
     *
     * @param am AbstractMethod passed during Resource filtering
     * @return
     */
    @Override
    public List<ResourceFilter> create(AbstractMethod am) {
        /*Test method level*/
        CacheMaxAge cma = am.getAnnotation(CacheMaxAge.class);
        NoCache nc = am.getAnnotation(NoCache.class);
        if (cma != null) {
            return Collections.<ResourceFilter>singletonList(new CacheResponseFilter(genCacheString(cma)));
        } else if (nc != null) {
            return Collections.<ResourceFilter>singletonList(noCacheResponseFilter);
        }
        /*Test class level*/
        cma = am.getResource().getAnnotation(CacheMaxAge.class);
        nc = am.getResource().getAnnotation(NoCache.class);
        if (cma != null) {
            return Collections.<ResourceFilter>singletonList(new CacheResponseFilter(genCacheString(cma)));
        } else if (nc != null) {
            return Collections.<ResourceFilter>singletonList(noCacheResponseFilter);
        }
        return Collections.emptyList();

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
