/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class TestHelper {

    public static EJBContainer getEJBContainer() throws NamingException {

        Map<String, Object> properties = new HashMap<>();                       // Init Ejb container
        properties.put(EJBContainer.MODULES, new File[]{new File("target/embed-classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");
        //properties.put(EJBContainer.APP_NAME,"class");
        //ejbContainer.getContext().rebind("inject", this);

        // Init shiro
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
        Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.SEVERE);
        Logger.getLogger("javax.enterprise.system").setLevel(Level.SEVERE);
        org.glassfish.ejb.LogFacade.getLogger().setLevel(Level.SEVERE);

        return EJBContainer.createEJBContainer(properties);
    }
}
