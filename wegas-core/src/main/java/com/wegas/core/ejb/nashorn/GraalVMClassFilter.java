/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import java.util.function.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class GraalVMClassFilter implements Predicate<String> {

    private static final Logger logger = LoggerFactory.getLogger(GraalVMClassFilter.class);

    private static final String[] blacklist = {
        "com.wegas.core.Helper", // "javax.naming.InitialContext",
    //"java.util.ResourceBundle",
    //"java.lang.System",
    //"java.lang.Thread",
    //"java.lang.Runtime",
    //"org.apache.shiro",
    //"org.postgresql",
    //"java.sql",
    //"java.util.Timer",
    //"java.net",
    //"java.nio",
    //"java.lang.ProcessBuilder",
    //"org.apache"
    };

    private static final String[] whitelist = {
        "java.lang.Short",
        "java.lang.Integer",
        "java.lang.Long",
        "java.lang.Float",
        "java.lang.Double",
        "java.lang.Number",
        "java.lang.String",
        "java.lang.Boolean",
        "java.util.Collection",
        "java.util.ArrayList",
        "java.util.LinkedList",
        "java.util.HashSet",
        "java.util.HashMap",
        "com.wegas.core.persistence",
        "com.wegas.core.i18n.persistence",
        "com.wegas.mcq.persistence",
        "com.wegas.messaging.persistence",
        "com.wegas.reviewing.persistence",
        "com.wegas.resourceManagement.persistence", // think twice before adding something here !!!
    };

    private static boolean containsStartsWith(String[] list, String item) {
        for (String s : list) {
            if (item.startsWith(s)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public boolean test(String name) {
        logger.trace("Try to load {}", name);
        if (containsStartsWith(blacklist, name)) {
            logger.error("{} is blacklisted !", name);
            GraalVMMonitor.registerBlacklistedClass(name);
            return false;
        }

        if (containsStartsWith(whitelist, name)) {
            logger.trace("LOAD {}", name);
            GraalVMMonitor.registerClass(name);
            return true;
        } else {
            logger.error("{} is not whitelisted !", name);
            GraalVMMonitor.registerNotWhitelistedClass(name);
            return false;
        }
    }
}
