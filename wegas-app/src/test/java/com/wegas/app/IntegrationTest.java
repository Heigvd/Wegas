/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import java.io.File;
import java.io.IOException;
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
        glassfishProperties.setPort("https-listener", 8181);
        glassfishProperties.setPort("http-listener", 8080);
        //glassfishProperties.setInstanceRoot("./src/test/glassfish/domains/domain1/");
        glassfishProperties.setConfigFileURI((new File("./src/test/glassfish/domains/domain1/config/domain.xml")).toURI().toString());
        //glassfishProperties.setConfigFileReadOnly(false);

        glassfish = GlassFishRuntime.bootstrap(bootstrapProperties).newGlassFish(glassfishProperties);
        glassfish.start();

//        File war = new File("./target/Wegas.war");
//        appName = glassfish.getDeployer().deploy(war, "--name=Wegas", "--contextroot=Wegas", "--force=true");
        // deployer.deploy(war);



        ClassLoader loader = Test.class.getClassLoader();
        System.out.println("oooooooooooo: "+loader.getResource("org/slf4j/spi/LocationAwareLogger.class"));
        System.out.println("oooooooooooo: "+loader.getResource("org/apache/commons/logging/Log.class"));

        ScatteredArchive archive = new ScatteredArchive("Wegas", ScatteredArchive.Type.WAR, new File("./src/main/webapp/"));
//        archive.addClassPath(new File("./target", "classes"));                // target/classes directory contains complied servlets
        //archive.addClassPath(new File("./src/main/webapp/"));                 // target/classes directory contains complied servlets
        //archive.addMetadata(new File("resources", "sun-web.xml"));            // resources/sun-web.xml is the WEB-INF/sun-web.xml
        //archive.addMetadata(new File("./src/main/webapp/test", "web.xml"));   // resources/web.xml is the WEB-INF/web.xml
        appName = glassfish.getDeployer().deploy(archive.toURI(), "--contextroot=Wegas");    // Deploy the scattered web archive.


        setBaseUrl("http://localhost:8080/Wegas/");
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        glassfish.getDeployer().undeploy(appName);
        glassfish.dispose();
    }

//    @Test
    public void hello() throws GlassFishException, IOException {
        beginAt("index.html");
//        //tester.beginAt("test-app/tests/wegas-alltests.htm");                                         //Open the browser on http://localhost:8080/Wegas/index.html
//        tester.beginAt("index.jsp");                   //Open the browser on http://localhost:8080/Wegas/index.html
//
//        //tester.clickLink("login");
//        //tester.assertTitleEquals("Login");
//        tester.setTextField("username", "root@root.com");
//        tester.setTextField("password", "test123");
//        tester.submit();
        assertTitleEquals("JSP Page");
    }
}
