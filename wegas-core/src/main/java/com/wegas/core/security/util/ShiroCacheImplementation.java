package com.wegas.core.security.util;

import com.hazelcast.core.HazelcastInstance;
import com.wegas.core.Helper;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import org.apache.shiro.cache.CacheException;

/**
 *
 * @author maxence
 */
public class ShiroCacheImplementation implements org.apache.shiro.cache.Cache {

    private final String MAP_NAME = "hz_shiro_sessions";

    private Map<Object, Object> getCache() throws NamingException {
        InitialContext ctx = new InitialContext();
        HazelcastInstance hzInstance = (HazelcastInstance) ctx.lookup(Helper.getWegasProperty("hazelcast.jndi_name"));
        return hzInstance.getMap(MAP_NAME);
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
