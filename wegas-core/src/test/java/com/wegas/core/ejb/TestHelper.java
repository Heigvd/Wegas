/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;

/**
 *
 * @author fx
 */
public class TestHelper {

    public static EJBContainer getEJBContainer() throws NamingException {
        Map<String, Object> properties = new HashMap<>();
        properties.put(EJBContainer.MODULES, new File[]{new File("target/embed-classes")});
        //properties.put(EJBContainer.APP_NAME,"class");
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");
        
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());

        return EJBContainer.createEJBContainer(properties);
    }
}
