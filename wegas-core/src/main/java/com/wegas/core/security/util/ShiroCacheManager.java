/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.hazelcast.core.HazelcastInstance;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import javax.naming.NamingException;
import org.apache.shiro.hazelcast.cache.HazelcastCacheManager;


/**
 *
 * @author maxence
 */
public class ShiroCacheManager extends HazelcastCacheManager {

    @Override
    protected HazelcastInstance createHazelcastInstance() {
        try {
            return Helper.jndiLookup(Helper.getWegasProperty("hazelcast.jndi_name"), HazelcastInstance.class);
        } catch (NamingException ex) {
            throw WegasErrorMessage.error("No Hazelcast instance");
        }
    }
}
