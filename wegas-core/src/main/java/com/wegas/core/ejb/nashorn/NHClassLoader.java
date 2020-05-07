/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class NHClassLoader extends ClassLoader {

    private static final String[] blacklist = {
        "com.wegas.core.Helper",
        "javax.naming.InitialContext",
        "java.util.ResourceBundle",
        "java.lang.System",
        "java.lang.Thread",
        "java.lang.Runtime",
        "org.apache.shiro",
        "org.postgresql",
        "java.sql",
        "java.net"
    };

    private static final Logger logger = LoggerFactory.getLogger(NHClassLoader.class);

    @Override
    public Class<?> loadClass(String name) throws ClassNotFoundException {
        logger.trace("Try to load {}", name);
        for (String s : blacklist) {
            if (name.startsWith(s)) {
                logger.error("{} is blacklisted !", name);
                return null;
            }
        }

        try {
            Class<?> loadClass = Thread.currentThread().getContextClassLoader().loadClass(name);
            logger.trace("LOAD {}", loadClass);
            return loadClass;
        } catch (ClassNotFoundException ex) {
            logger.trace("LOAD ERROR {}", name);
            throw ex;
        }
    }
}
