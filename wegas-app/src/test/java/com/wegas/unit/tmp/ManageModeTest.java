/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit.tmp;

import com.wegas.utils.TestHelper;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import junit.framework.Assert;
import org.apache.commons.io.IOUtils;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.impl.client.DefaultHttpClient;
import org.glassfish.embeddable.BootstrapProperties;
import org.glassfish.embeddable.Deployer;
import org.glassfish.embeddable.GlassFish;
import org.glassfish.embeddable.GlassFishException;
import org.glassfish.embeddable.GlassFishProperties;
import org.glassfish.embeddable.GlassFishRuntime;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class ManageModeTest {

    private static GlassFish glassfish;
    private HttpClient client;

    @BeforeClass
    public static void setUpClass() throws Exception {
        BootstrapProperties bootstrapProperties = new BootstrapProperties();

        GlassFishProperties glassfishProperties = new GlassFishProperties();
        glassfishProperties.setPort("http-listener-1", 5454);
        glassfishProperties.setPort("http-listener-2", 5353);
        //glassfishProperties.setInstanceRoot("./src/test/glassfish/domains/domain1");
        glassfishProperties.setConfigFileURI((new File("./src/test/glassfish/domains/domain1/config/domain.xml")).toURI().toString());
        //glassfishProperties.setConfigFileReadOnly(false);
        TestHelper.resetTestDB();
        glassfish = GlassFishRuntime.bootstrap(bootstrapProperties).newGlassFish(glassfishProperties);
        Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);
        glassfish.start();

        File war = new File("./target/Wegas.war");
        Deployer deployer = glassfish.getDeployer();
        deployer.deploy(war);

    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        if (glassfish != null) {
            Deployer deployer = glassfish.getDeployer();
            if (deployer != null) {
                deployer.getDeployedApplications().stream().forEach(n -> {
                    try {
                        deployer.undeploy(n);
                    } catch (GlassFishException ex) {
                        Logger.getLogger(ManageModeTest.class.getName()).log(Level.SEVERE, null, ex);
                    }
                });
            }
            glassfish.dispose();
        }
    }

    @Before
    public void setUp() {
        client = new DefaultHttpClient();
    }

    public String login() throws IOException {
        HttpUriRequest loginRequest = new HttpPost("http://localhost:5454/Wegas/rest/User/Authenticate/?email=root@root.com&password=1234&remember=true");
        HttpResponse loginResponse = client.execute(loginRequest);

        Assert.assertEquals(HttpStatus.SC_NO_CONTENT, loginResponse.getStatusLine().getStatusCode());

        Header[] allHeaders = loginResponse.getAllHeaders();
        String cookie = "";

        for (Header h : allHeaders) {
            if ("Set-Cookie".equals(h.getName())) {
                cookie = h.getValue();
                break;
            }
        }

        return cookie;
    }

    public void createGameModel() {

    }

    @Test
    public void manageModeTest() throws IOException, ScriptException {
        String cookie = login();

        HttpUriRequest getGameModels = new HttpGet("http://localhost:5454/Wegas/rest/GameModel");
        getGameModels.setHeader("Content-Type", "application/json");
        getGameModels.setHeader("Cookie", cookie);
        getGameModels.setHeader("Managed-Mode", "true");

        HttpResponse execute = client.execute(getGameModels);

        Assert.assertEquals(HttpStatus.SC_OK, execute.getStatusLine().getStatusCode());

        HttpEntity entity = execute.getEntity();
        InputStream content = entity.getContent();
        String json = IOUtils.toString(content);

        ScriptEngineManager sem = new ScriptEngineManager();
        ScriptEngine engine = sem.getEngineByExtension("js");

        String script;
        script = "var obj = eval('(' + json + ')'),";
        script += "    cl = obj[\"@class\"];";
        script += "cl";
        engine.put("json", json);
        Object eval = engine.eval(script);
        if (eval == null) {
            junit.framework.Assert.fail(json);
        }
    }
}
