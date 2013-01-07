/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.util;

import javax.annotation.PostConstruct;
import javax.enterprise.inject.Produces;
import javax.inject.Named;
import javax.inject.Singleton;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Instantantiate a security manager and a subject, once per request. currently
 * not in use nowhere.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
//@Singleton
public class SecurityProducer {

    Logger logger = LoggerFactory.getLogger(SecurityProducer.class);
    private SecurityManager securityManager;

//    @PostConstruct
    public void init() {
        final String iniFile = "classpath:shiro.ini";
        logger.info("Initializing Shiro INI SecurityManager using " + iniFile);
        securityManager = new IniSecurityManagerFactory(iniFile).getInstance();
        SecurityUtils.setSecurityManager(securityManager);
    }

//    @Produces
//    @Named("securityManager")
    public SecurityManager getSecurityManager() {
        return securityManager;
    }

//    @Produces
    public Subject getSubject() {
        return SecurityUtils.getSubject();
    }
}