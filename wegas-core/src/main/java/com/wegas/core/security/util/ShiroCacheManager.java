/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.hazelcast.map.IMap;
import com.wegas.core.Helper;
import javax.naming.NamingException;
import com.hazelcast.core.HazelcastInstance;
import org.apache.shiro.ShiroException;
import org.apache.shiro.cache.Cache;
import org.apache.shiro.cache.CacheException;
import org.apache.shiro.cache.CacheManager;
import org.apache.shiro.cache.MapCache;
import org.apache.shiro.util.Destroyable;
import org.apache.shiro.util.Initializable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class ShiroCacheManager implements CacheManager, Initializable, Destroyable {

    private static final Logger logger = LoggerFactory.getLogger(ShiroCacheManager.class);

    /**
     * Since there is no CDI context here, we cannot @Inject HazelcastInstance or @Inject
     * Cache<?, ?>
     * This methods stands here to replace this behaviour
     *
     * @return hazelcast instance
     *
     * @throws NamingException if fails to retrieve the hazelcast cast, major issue
     */
    private HazelcastInstance getHazelcastInstance() throws NamingException {
        logger.info("Get Hazelcast Instance");
        HazelcastInstance hzInstance = Helper.jndiLookup(Helper.getWegasProperty("hazelcast.jndi_name"), HazelcastInstance.class);
        logger.info("Got hazelcast instance");
        return hzInstance;
    }

    @Override
    public <K, V> Cache<K, V> getCache(String name) throws CacheException {
        IMap<K, V> map;
        logger.info("Get cache '{}'", name);
        try {
            map = getHazelcastInstance().getMap(name);
        } catch (NamingException ex) {
            logger.error("Get HazelcastInstance failed", ex);
            throw new CacheException(ex);
        }
        logger.info("GetCache '{}'; initial size: {}", name, map.size());
        return new MapCache<>(name, map);
    }

    @Override
    public void init() throws ShiroException {
        logger.info("Init shiro cache manager");
    }

    @Override
    public void destroy() throws Exception {
        logger.info("Destroy shiro cache manager");
    }
}
