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

    @Override
    public List<ResourceFilter> create(AbstractMethod am) {
        /*Test method level*/
        CacheMaxAge cma = am.getAnnotation(CacheMaxAge.class);
        NoCache nc = am.getAnnotation(NoCache.class);
        if (cma != null) {
            return Collections.<ResourceFilter>singletonList(new CacheResponseFilter("max-age: " + cma.unit().toSeconds(cma.time())));
        } else if (nc != null) {
            return Collections.<ResourceFilter>singletonList(new CacheResponseFilter("no-cache"));
        }
        /*Test class level*/
        cma = am.getResource().getAnnotation(CacheMaxAge.class);
        nc = am.getResource().getAnnotation(NoCache.class);
        if (cma != null) {
            return Collections.<ResourceFilter>singletonList(new CacheResponseFilter("max-age: " + cma.unit().toSeconds(cma.time())));
        } else if (nc != null) {
            return Collections.<ResourceFilter>singletonList(new CacheResponseFilter("no-cache"));
        }
        return Collections.emptyList();

    }
}
