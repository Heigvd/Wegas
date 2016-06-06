/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import javax.annotation.PreDestroy;
import javax.ejb.Singleton;
import net.sf.ehcache.CacheManager;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Singleton
public class CacheManagerHolder {

    private final CacheManager instance;

    /**
     *
     */
    public CacheManagerHolder() {
        instance = CacheManager.getInstance();
    }

    /**
     *
     * @return
     */
    public CacheManager getInstance() {
        return instance;
    }

    @PreDestroy
    private void onDestroy() {
        instance.shutdown();
    }
}
