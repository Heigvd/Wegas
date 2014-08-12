/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.security.ejb.UserFacade;
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
public abstract class AbstractEmbeddedGlassfishTest extends AbstractTest {

    private static GlassFish glassfish;
    private static String appName;

    protected static Context context;

    protected static GameModelFacade gmFacade;
    protected static UserFacade userFacade;

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
            //ScatteredArchive archive = new ScatteredArchive("Wegas", 
            //        ScatteredArchive.Type.WAR,
            //        new File("./target/embed-war/"));
            //archive.addClassPath(new File("./target/classes/"));                    // target/classes directory contains complied servlets
            //archive.addClassPath(new File("../wegas-core/target/classes"));         // wegas-core dependency

            setBaseUrl("http://localhost:5454/Wegas");

            context = AbstractEmbeddedGlassfishTest.getContext();

            userFacade = lookup(UserFacade.class);

            userFacade.guestLogin();
            gmFacade = lookup(GameModelFacade.class);
        } catch (Exception e) {
            if (glassfish != null) {
                glassfish.dispose();
            }
            throw e;
        }
    }

    private static Context getContext() throws NamingException {
        Properties props = new Properties();
        props.setProperty("java.naming.factory.initial",
                "com.sun.enterprise.naming.SerialInitContextFactory");
        props.setProperty("java.naming.factory.url.pkgs",
                "com.sun.enterprise.naming");
        props.setProperty("java.naming.factory.state",
                "com.sun.corba.ee.impl.presentation.rmi.JNDIStateFactoryImpl");
        // props.setProperty("org.omg.CORBA.ORBInitialHost", "localhost");
        // props.setProperty("org.omg.CORBA.ORBInitialPort", "3700");

        // return new InitialContext(props);
        return new InitialContext();
    }

    @AfterClass
    public static void tearDown() throws Exception {
        glassfish.getDeployer().undeploy(appName);
        glassfish.dispose();
    }

    protected static <T> T lookup(Class<T> the_class) {
        T lookup = null;
        try {
            lookup = (T) context.lookup("java:global/Wegas/" + the_class.getSimpleName());
            return lookup;
        } catch (NamingException ex) {
            Logger.getLogger(AbstractEmbeddedGlassfishTest.class.getName()).log(Level.SEVERE, "LOOKUP FAILED: " + the_class.getSimpleName(), ex);
        }
        return lookup;
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
