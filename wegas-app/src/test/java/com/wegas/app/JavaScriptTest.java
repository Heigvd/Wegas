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
import org.glassfish.embeddable.GlassFish;
import org.glassfish.embeddable.GlassFishException;
import org.glassfish.embeddable.GlassFishProperties;
import org.glassfish.embeddable.GlassFishRuntime;
import org.glassfish.embeddable.archive.ScatteredArchive;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class JavaScriptTest {

    private static GlassFish glassfish;
    private static String appName;

    @BeforeClass
    public static void setUpClass() throws Exception {
        GlassFishProperties glassfishProperties = new GlassFishProperties();
        glassfishProperties.setPort("http-listener", 5353);
        glassfishProperties.setPort("https-listener", 5252);

        glassfish = GlassFishRuntime.bootstrap().newGlassFish(glassfishProperties);
        glassfish.start();

        ScatteredArchive archive = new ScatteredArchive("Wegas", ScatteredArchive.Type.WAR, new File("./src/main/webapp/wegas-app/"));
        appName = glassfish.getDeployer().deploy(archive.toURI(), "--contextroot=wegas-app");

        setBaseUrl("http://localhost:5353/wegas-app/");
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        glassfish.getDeployer().undeploy(appName);
        glassfish.dispose();
    }

    @Test
    public void testJs() throws GlassFishException, IOException {
        beginAt("tests/wegas-alltests.htm");
        assertTitleEquals("Wegas Test Suite");
    }
}
