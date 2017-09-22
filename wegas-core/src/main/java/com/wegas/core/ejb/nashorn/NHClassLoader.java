/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
        "org.apache.shiro"
    };

    Logger logger = LoggerFactory.getLogger(NHClassLoader.class);

    @Override
    public Class<?> loadClass(String name) throws ClassNotFoundException {
        logger.error("Try to load {}", name);
        for (String s : blacklist) {
            if (name.startsWith(s)) {
                logger.error("{} is blacklisted !", name);
                return null;
            }
        }

        try {
            Class<?> loadClass = Thread.currentThread().getContextClassLoader().loadClass(name);
            logger.error("LOAD {}", loadClass);
            return loadClass;
        } catch (ClassNotFoundException ex) {
            logger.error("LOAD ERROR {}", name);
            throw ex;
        }
    }
}
