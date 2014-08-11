/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.File;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import static net.sourceforge.jwebunit.junit.JWebUnit.*;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.util.Factory;
import org.glassfish.embeddable.*;
import org.junit.AfterClass;
import org.junit.BeforeClass;

/**
 *
 * @author Maxence Laurent <maxence.laurent> <gmail> <com>
 */
public class AbstractEmbeddedGlassfishTest {

    private static GlassFish glassfish;
    private static String appName;

    protected static Context context;

    protected static GameModelFacade gmFacade;

    @BeforeClass
    public static void setUp() throws Exception {
        try {
            Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro.ini");
            SecurityManager securityManager = factory.getInstance();
            SecurityUtils.setSecurityManager(securityManager);

            BootstrapProperties bootstrapProperties = new BootstrapProperties();
            //bootstrapProperties.setInstallRoot("./src/test/glassfish");           // Only for glassfish-embedded-staticshell

            GlassFishProperties glassfishProperties = new GlassFishProperties();
            glassfishProperties.setPort("https-listener", 5353);
            glassfishProperties.setPort("http-listener", 5454);

            glassfishProperties.setConfigFileURI((new File("./src/test/glassfish/domains/domain1/config/domain.xml")).toURI().toString());

            TestHelper.resetTestDB();

            glassfish = GlassFishRuntime.bootstrap(bootstrapProperties).newGlassFish(glassfishProperties);

            Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
            Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);

            glassfish.start();

            File war = new File("./target/Wegas.war");

            appName = glassfish.getDeployer().deploy(war, "--contextroot=Wegas");

            setBaseUrl("http://localhost:5454/Wegas");

            gmFacade = lookup(GameModelFacade.class);
        } catch (Exception e) {
            if (glassfish != null) {
                glassfish.dispose();
            }
            throw e;
        }
    }

    protected User guestLogin(){
        return lookup(UserFacade.class).guestLogin();
    }

    private static Context getContext() throws NamingException {
        if (context == null){
            context = new InitialContext();
        }
        return context;
    }

    @AfterClass
    public static void tearDown() throws Exception {
        glassfish.getDeployer().undeploy(appName);
        glassfish.dispose();
    }

    protected static <T> T lookup(Class<T> the_class) {
        T lookup = null;
        try {
            lookup = (T) getContext().lookup("java:global/Wegas/" + the_class.getSimpleName());
            return lookup;
        } catch (NamingException ex) {
            Logger.getLogger(AbstractEmbeddedGlassfishTest.class.getName()).log(Level.SEVERE, "LOOKUP FAILED: " + the_class.getSimpleName(), ex);
        }
        return lookup;
    }

}
