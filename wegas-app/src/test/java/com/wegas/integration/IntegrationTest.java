/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.utils.TestHelper;
import com.wegas.utils.WegasRESTClient;
import com.wegas.utils.WegasRESTClient.TestAuthenticationInformation;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import junit.framework.Assert;
import net.sourceforge.jwebunit.api.IElement;
import net.sourceforge.jwebunit.junit.JWebUnit;
import static net.sourceforge.jwebunit.junit.JWebUnit.*;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class IntegrationTest {

    private static final Logger logger = LoggerFactory.getLogger(IntegrationTest.class);

    private static GlassFish glassfish;
    private static String appName;

    private static WegasRESTClient client;

    private static TestAuthenticationInformation root;
    private static TestAuthenticationInformation scenarist;
    private static TestAuthenticationInformation trainer;
    private static TestAuthenticationInformation user;

    private GameModel artos;

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
        //Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        //Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);
        glassfish.start();

        File war = new File("./target/Wegas.war");
        Deployer deployer = glassfish.getDeployer();
        appName = deployer.deploy(war);

        File appDirectory = new File("target/Wegas/");
        Helper.setWegasRootDirectory(appDirectory.getAbsolutePath());

        client = new WegasRESTClient("http://localhost:5454/Wegas");

        scenarist = client.signup("scenarist@local", "1234");
        trainer = client.signup("trainer@local", "1234");
        user = client.signup("user@local", "1234");

        root = client.getAuthInfo("root@root.com", "1234");
        root.setUserId(1l);

        client.login(root);
        grantRights();
        logger.error("SETUP COMPLETED");
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        if (glassfish != null) {
            Deployer deployer = glassfish.getDeployer();
            if (deployer != null) {
                deployer.undeploy(appName);
            }
            glassfish.dispose();
        }
    }

    @Before
    public void setUp() throws IOException, JSONException {
        loadArtos();
    }

    private static void grantRights() throws IOException {
        Map<String, Role> roles = client.getRoles();

        logger.error("ROLES: ");
        for (Entry<String, Role> entry : roles.entrySet()) {
            logger.error(entry.getKey());
        }

        User scenUser = client.get("/rest/User/" + scenarist.getUserId(), User.class);
        scenUser.getRoles().add(roles.get("Scenarist"));
        scenUser.getRoles().add(roles.get("Trainer"));

        client.put("/rest/User/Account/" + scenUser.getMainAccount().getId(), scenUser.getMainAccount());

        User trainerUser = client.get("/rest/User/" + trainer.getUserId(), User.class);
        trainerUser.getRoles().add(roles.get("Trainer"));

        client.put("/rest/User/Account/" + trainerUser.getMainAccount().getId(), trainerUser.getMainAccount());
    }

    private void loadArtos() throws IOException, JSONException {
        artos = client.postJSONFromFile("/rest/GameModel", "src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json", GameModel.class);
    }

    @Test
    public void testUpdateAndCreateGame() throws IOException, JSONException {

        GameModel myGameModel = client.postJSONFromFile("/rest/GameModel", "src/test/resources/gmScope.json", GameModel.class);

        Game myGame = client.postJSON_asString("/rest/GameModel/" + myGameModel.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + myGameModel.getId() + "\",\"access\":\"OPEN\",\"name\":\"My Test Game\"}", Game.class);
        myGame.getId();
    }

    @Test
    public void createGameTest() throws IOException, JSONException {
        Game myGame = client.postJSON_asString("/rest/GameModel/" + this.artos.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + this.artos.getId() + "\",\"access\":\"OPEN\",\"name\":\"My Artos Game\"}", Game.class);

        Game myGameFromGet = client.get("/rest/GameModel/Game/" + myGame.getId(), Game.class);

        /* Is the debug team present */
        Assert.assertEquals(1, myGameFromGet.getTeams().size());
        Assert.assertEquals(1, myGameFromGet.getTeams().get(0).getPlayers().size());
    }

    @Test
    public void getVariableDescriptor() throws IOException, JSONException {
        List<VariableDescriptor> descs;

        descs = (List<VariableDescriptor>) (client.get("/rest/GameModel/" + this.artos.getId() + "/VariableDescriptor", new TypeReference<List<VariableDescriptor>>() {
        }));
        for (VariableDescriptor vd : descs) {
            logger.error("NAME: " + vd.getLabel());
        }
    }

    @Test
    public void manageModeTest() throws IOException, JSONException {
        List<GameModel> get = (List<GameModel>) client.get("/rest/GameModel", new TypeReference<List<GameModel>>() {
        });
        get.size();
    }

    @Test
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
        assertTitleEquals("Web Game Authoring System - Wegas");

        //tester.setTextField("username", "root@root.com");
        //tester.setTextField("password", "test123");
        //tester.clickLink("login");
        //tester.submit();
    }

    @Test
    public void testJavascript() {
        JWebUnit.setScriptingEnabled(true);
        beginAt("wegas-app/tests/wegas-alltests.htm");
        assertTitleEquals("Wegas Test Suite");

        String pageSource = JWebUnit.getPageSource();

        IElement passed = JWebUnit.getElementByXPath("//span[@class='passed']");
        IElement total = JWebUnit.getElementByXPath("//span[@class='total']");

        String pContent = passed.getTextContent();

        String tContent = total.getTextContent();

        logger.error("TESTS:  " + pContent + "/" + tContent);
    }
}
