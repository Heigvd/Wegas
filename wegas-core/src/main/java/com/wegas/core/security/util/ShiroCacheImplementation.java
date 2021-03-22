
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.IMap;
import com.wegas.core.Helper;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import javax.naming.NamingException;
import org.apache.shiro.cache.CacheException;

/**
 *
 * @author maxence
 */
public class ShiroCacheImplementation implements org.apache.shiro.cache.Cache {

    private static final String MAP_NAME = "hz_shiro_sessions";

    /**
     * Since there is no CDI context here, we cannot @Inject HazelcastInstance or @Inject
     * Cache<?, ?>
     * This methods stands here to replace this behaviour
     *
     * @return the cache
     *
     * @throws NamingException fails to retrieve the hazelcast cast, major issue
     */
    private Map<Object, Object> getCache() throws NamingException {
        //long start = System.currentTimeMillis();
        HazelcastInstance hzInstance = Helper.jndiLookup(Helper.getWegasProperty("hazelcast.jndi_name"), HazelcastInstance.class);

        IMap<Object, Object> map = hzInstance.getMap(MAP_NAME);
//        long duration = System.currentTimeMillis() - start;
//        logger.error("Get Shiro Hz Cache in {} ms", duration);
        return map;
    }

    @Override
    public void clear() throws CacheException {
        try {
            this.getCache().clear();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Object get(Object key) throws CacheException {
        try {
            return this.getCache().get(key);
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Set keys() {
        try {
            return this.getCache().keySet();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Object put(Object key, Object value) throws CacheException {
        try {
            this.getCache().put(key, value);
            return this.get(key);
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Object remove(Object key) throws CacheException {
        try {
            return this.getCache().remove(key);
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public int size() {
        try {
            return this.getCache().size();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Collection values() {
        try {
            return this.getCache().values();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

}
