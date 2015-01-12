/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.security.ejb.UserFacade;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.glassfish.embeddable.GlassFishException;
import org.junit.AfterClass;
import org.junit.BeforeClass;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public abstract class AbstractEJBContainerTest extends AbstractTest {

    private static EJBContainer container;
    protected static GameModelFacade gmFacade;

    @BeforeClass
    public static void setUp() throws Exception {
        Map<String, Object> properties = new HashMap<>();                       // Init Ejb container
        properties.put(EJBContainer.MODULES, new File[]{new File("../wegas-core/target/embed-classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "../wegas-core/src/test/glassfish");
        //properties.put(EJBContainer.APP_NAME,"class");
        //ejbContainer.getContext().rebind("inject", this);

        // Init shiro
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
        Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);

        container = EJBContainer.createEJBContainer(properties);
        Helper.lookupBy(container.getContext(), UserFacade.class, UserFacade.class).guestLogin(); //login as guest

        gmFacade = Helper.lookupBy(container.getContext(), GameModelFacade.class, GameModelFacade.class);
    }

    @AfterClass
    public static void tearDown() throws GlassFishException {
        container.close();
    }

    protected <T> T lookup(Class<T> className) {
        try {
            return Helper.lookupBy(container.getContext(), className, className);
        } catch (NamingException ex) {
            return null;
        }
    }

    @Override
    protected ScriptController getScriptController() {
        return lookup(ScriptController.class);
    }

    @Override
    protected VariableDescriptorFacade getVariableDescriptorFacade() {
        return lookup(VariableDescriptorFacade.class);
    }
}
