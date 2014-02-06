/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.gargoylesoftware.htmlunit.ScriptException;
import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import static net.sourceforge.jwebunit.junit.JWebUnit.*;
import org.glassfish.embeddable.*;
import org.glassfish.embeddable.archive.ScatteredArchive;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

//import net.sourceforge.jwebunitsourceforge.jwebunit.junit.WebTester;
/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class IntegrationTest {

    private static GlassFish glassfish;
    private static String appName;

    @BeforeClass
    public static void setUpClass() throws Exception {
        BootstrapProperties bootstrapProperties = new BootstrapProperties();
        //bootstrapProperties.setInstallRoot("./src/test/glassfish");           // Only for glassfish-embedded-staticshell

        GlassFishProperties glassfishProperties = new GlassFishProperties();
        glassfishProperties.setPort("https-listener", 5353);
        glassfishProperties.setPort("http-listener", 5454);
        //glassfishProperties.setInstanceRoot("./src/test/glassfish/domains/domain1");
        glassfishProperties.setConfigFileURI((new File("./src/test/glassfish/domains/domain1/config/domain.xml")).toURI().toString());
        //glassfishProperties.setConfigFileReadOnly(false);
        TestHelper.createIntegrationDB();
        glassfish = GlassFishRuntime.bootstrap(bootstrapProperties).newGlassFish(glassfishProperties);
        Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);
        glassfish.start();

        //File war = new File("./target/Wegas.war");
        //appName = glassfish.getDeployer().deploy(war, "--name=Wegas", "--contextroot=Wegas", "--force=true");
        // deployer.deploy(war);
        ScatteredArchive archive = new ScatteredArchive("Wegas", ScatteredArchive.Type.WAR,
                new File("./target/embed-war/"));
        archive.addClassPath(new File("./target/classes/"));                  // target/classes directory contains complied servlets
        archive.addClassPath(new File("../wegas-core/target/classes"));         // wegas-core dependency
        //archive.addClassPath(new File("../wegas-core/target/wegas-core_1.0-SNAPSHOT.jar"));// wegas-core dependency
        //archive.addMetadata(new File("./src/main/webapp/WEB-INF", "web.xml"));// resources/sun-web.xml is the WEB-INF/sun-web.xml
        //archive.addMetadata(new File("./src/main/webapp/test", "web.xml"));   // resources/web.xml is the WEB-INF/web.xml
        appName = glassfish.getDeployer().deploy(archive.toURI(), "--contextroot=Wegas");    // Deploy the scattered web archive.

        setBaseUrl("http://localhost:5454/Wegas");
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        glassfish.getDeployer().undeploy(appName);
        glassfish.dispose();
        TestHelper.dropIntegrationDB();
    }

    @Test(expected = ScriptException.class)
    public void hello() throws GlassFishException, IOException {
        //java.lang.System.setProperty("org.apache.commons.logging.simplelog.defaultlog", "debug");
        //beginAt("test.htm");
        //assertTitleEquals("My Page");
        try {
            beginAt("login.html?debug=true");
        } catch (NullPointerException e) {  //@fixme error using xmlhttprequest from jwebunit
            System.out.println("Jweb unit encountered an exception");
            // e.printStackTrace();
        }
        assertResponseCode(200);
        assertTitleEquals("Login - Wegas");

        //tester.setTextField("username", "root@root.com");
        //tester.setTextField("password", "test123");
        //tester.clickLink("login");
        //tester.submit();
    }
}
