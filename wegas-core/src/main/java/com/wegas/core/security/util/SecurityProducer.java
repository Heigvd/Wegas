/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Instantantiate a security manager and a subject, once per request.
 *
 * Not in use.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
//@Singleton
public class SecurityProducer {

    Logger logger = LoggerFactory.getLogger(SecurityProducer.class);
    private SecurityManager securityManager;

//    @PostConstruct
    /**
     *
     */
    public void init() {
        final String iniFile = "classpath:shiro.ini";
        logger.info("Initializing Shiro INI SecurityManager using " + iniFile);
        securityManager = new IniSecurityManagerFactory(iniFile).getInstance();
        SecurityUtils.setSecurityManager(securityManager);
    }

//    @Produces
//    @Named("securityManager")
    /**
     *
     * @return
     */
    public SecurityManager getSecurityManager() {
        return securityManager;
    }

//    @Produces
    /**
     *
     * @return
     */
    public Subject getSubject() {
        return SecurityUtils.getSubject();
    }
}