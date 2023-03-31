/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.hazelcast.config.MapConfig;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import com.hazelcast.multimap.MultiMap;
import com.wegas.core.Helper;
import com.wegas.core.servlet.ApplicationStartup;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.logging.Level;
import javax.cache.expiry.ExpiryPolicy;
import javax.naming.NamingException;
import org.apache.shiro.cache.CacheException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class ShiroCacheImplementation implements org.apache.shiro.cache.Cache {

    private static final String MAP_NAME = "hz_shiro_sessions";
    private final Logger logger = LoggerFactory.getLogger(ShiroCacheImplementation.class);

    /*
    static {
        try {
            var mapConfig  = new MapConfig();

            var hz = Helper.jndiLookup(Helper.getWegasProperty("hazelcast.jndi_name"), HazelcastInstance.class);

            var current = hz.getConfig().getMapConfig(MAP_NAME).
        } catch (NamingException ex) {
            java.util.logging.Logger.getLogger(ShiroCacheImplementation.class.getName()).log(Level.SEVERE, null, ex);
        }
    }*/

    /**
     * Since there is no CDI context here, we cannot @Inject HazelcastInstance or @Inject
     * Cache<?, ?>
     * This methods stands here to replace this behaviour
     *
     * @return the cache
     *
     * @throws NamingException fails to retrieve the hazelcast cast, major issue
     */
    private IMap<Object, Object> getCache() throws NamingException {
        //long start = System.currentTimeMillis();
        HazelcastInstance hzInstance = Helper.jndiLookup(Helper.getWegasProperty("hazelcast.jndi_name"), HazelcastInstance.class);

        IMap<Object, Object> map = hzInstance.getMap(MAP_NAME);

        //logger.warn(map.);
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
            var cache = this.getCache();

            //logger.warn("******************************************* key {} lock status {}", key, cache.isLocked(key));
            var future = cache.getAsync(key);
            logger.warn("*********** getAsync {}", key);
            var res = future.toCompletableFuture().get();
            logger.warn("FINISHED *********** getAsync {}", key);

            return res;
            //return cache.get(key);
        } catch (NamingException ex) {
            throw new CacheException(ex);
        } catch (InterruptedException | ExecutionException ex) {
            java.util.logging.Logger.getLogger(ShiroCacheImplementation.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public Set keys() {
        try {
            logger.warn("***********$$$ keys()");

            return this.getCache().keySet();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Object put(Object key, Object value) throws CacheException {
        try {
            logger.warn("***********#### put()");

            //this.getCache().setAsync(key, value).toCompletableFuture().get();
            this.getCache().setAsync(key, value).toCompletableFuture().get();

            return this.get(key);
        } catch (NamingException ex) {
            throw new CacheException(ex);
        } catch (InterruptedException | ExecutionException ex) {
            java.util.logging.Logger.getLogger(ShiroCacheImplementation.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public Object remove(Object key) throws CacheException {
        try {
            logger.warn("***********-- remove()");

            //return this.getCache().remove(key);//.toCompletableFuture().get();
            return this.getCache().removeAsync(key).toCompletableFuture().get();

        } catch (NamingException ex) {
            throw new CacheException(ex);
        } catch (InterruptedException | ExecutionException ex) {
            java.util.logging.Logger.getLogger(ShiroCacheImplementation.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public int size() {
        try {
            logger.warn("***********-------- size()");

            return this.getCache().size();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

    @Override
    public Collection values() {
        try {
            logger.warn("***********----8888---- values()");

            return this.getCache().values();
        } catch (NamingException ex) {
            throw new CacheException(ex);
        }
    }

}
