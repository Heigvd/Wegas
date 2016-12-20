/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.utils.AbstractTest;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.glassfish.embeddable.GlassFishException;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.slf4j.LoggerFactory;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public abstract class AbstractEJBContainerTest extends AbstractTest {

    private static EJBContainer container;

    private static GameModelFacade gmFacade;

    protected static GameFacade gameFacade;

    protected static TeamFacade teamFacade;

    protected static UserFacade userFacade;

    protected static ScriptFacade scriptFacade;

    protected static RequestFacade requestFacade;

    protected static VariableDescriptorFacade variableDescriptorFacade;

    private static org.slf4j.Logger logger = LoggerFactory.getLogger(AbstractEJBContainerTest.class);

    @BeforeClass
    public static void setUp() throws Exception {
        if (container == null) {
            Map<String, Object> properties = new HashMap<>();                       // Init Ejb container
            properties.put(EJBContainer.MODULES, new File[]{new File("../wegas-core/target/embed-classes")});
            properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "../wegas-core/src/test/glassfish");
            //properties.put(EJBContainer.APP_NAME,"class");
            //ejbContainer.getContext().rebind("inject", this);

            // Init shiro
            SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());

            /* Log Levels */
            Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.SEVERE);
            Logger.getLogger("javax.enterprise.system").setLevel(Level.SEVERE);
            org.glassfish.ejb.LogFacade.getLogger().setLevel(Level.SEVERE);

            logger.error("CREATE CONTAINER");

            container = EJBContainer.createEJBContainer(properties);

            gameFacade = GameFacade.lookup();
            gmFacade = GameModelFacade.lookup();
            teamFacade = TeamFacade.lookup();
            userFacade = UserFacade.lookup();
            requestFacade = RequestFacade.lookup();
            scriptFacade = ScriptFacade.lookup();

            variableDescriptorFacade = VariableDescriptorFacade.lookup();

            userFacade.guestLogin();
        }
    }

    @AfterClass
    public static void tearDown() throws GlassFishException, NamingException {
//        if (container != null) {
//            logger.error("CLOSE CONTAINER");
//            container.getContext().close();
//            container.close();
//            container = null;
//        }
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

    @Override
    protected GameModelFacade getGameModelFacade() {
        return gmFacade;
    }
}
