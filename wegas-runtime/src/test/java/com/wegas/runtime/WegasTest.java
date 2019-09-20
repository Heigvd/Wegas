/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.runtime;

import com.fasterxml.jackson.core.type.TypeReference;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.DomElement;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.test.TestHelper;
import com.wegas.utils.WegasRESTClient;
import com.wegas.utils.WegasRESTClient.TestAuthenticationInformation;
import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.container.test.api.TargetsContainer;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.importer.ExplodedImporter;
import org.jboss.shrinkwrap.api.spec.WebArchive;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@RunWith(Arquillian.class)
public class WegasTest {

    @Rule
    public TestName name = new TestName();

    private static final String WEGAS_ROOT_DIR = "../wegas-app/";

    private static final Logger logger = LoggerFactory.getLogger(WegasTest.class);

    private static WegasRESTClient client;

    private static WegasRESTClient client2;

    private static TestAuthenticationInformation root;
    private static TestAuthenticationInformation scenarist;
    private static TestAuthenticationInformation trainer;
    private static TestAuthenticationInformation user;

    GameModel artos;

    @Deployment(name = "wegas1")
    //@OverProtocol("Local")
    @TargetsContainer("payara1")
    public static WebArchive deployFirst() {
        return createDeployment();
    }

    @Deployment(name = "wegas2")
    //@OverProtocol("Local")
    @TargetsContainer("payara2")
    public static WebArchive deploySecond() {
        return createDeployment();
    }

    public static WebArchive createDeployment() {
        WegasRuntime.resetDB("wegas_test");
        String warPath;
        warPath = "../wegas-app/target/Wegas";

        WebArchive war = ShrinkWrap.create(ExplodedImporter.class)
                .importDirectory(new File(warPath))
                .as(WebArchive.class);

        return war;
    }

    @BeforeClass
    public static void setUpClass() {
        try {
            client = new WegasRESTClient("http://localhost:28080/Wegas");
            client2 = new WegasRESTClient("http://localhost:28081/Wegas");

            scenarist = client.signup("scenarist@local", "1234");
            trainer = client.signup("trainer@local", "1234");
            user = client.signup("user@local", "1234");

            root = client.getAuthInfo("root@root.com", "1234");
            root.setUserId(1l);

            client.login(root);
            grantRights();
            logger.info("SETUP COMPLETED");
        } catch (IOException ex) {
            java.util.logging.Logger.getLogger(WegasTest.class.getName()).log(Level.SEVERE, null, ex);
        }

    }

    @Before
    public void setUp() throws IOException {
        logger.info("TEST {}", name.getMethodName());
        logger.info("LOGIN as root");
        client.login(root);
        client.get("/rest/Utils/SetPopulatingSynchronous");
        loadArtos();
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
    }

    private static void grantRights() throws IOException {
        Map<String, Role> roles = client.getRoles();

        logger.info("ROLES: ");
        for (Entry<String, Role> entry : roles.entrySet()) {
            logger.info(entry.getKey());
        }

        User scenUser = client.get("/rest/User/" + scenarist.getUserId(), User.class);
        scenUser.getRoles().add(roles.get("Scenarist"));
        scenUser.getRoles().add(roles.get("Trainer"));

        client.put("/rest/User/Account/" + scenUser.getMainAccount().getId(), scenUser.getMainAccount());

        User trainerUser = client.get("/rest/User/" + trainer.getUserId(), User.class);
        trainerUser.getRoles().add(roles.get("Trainer"));

        client.put("/rest/User/Account/" + trainerUser.getMainAccount().getId(), trainerUser.getMainAccount());
    }

    private void loadArtos() throws IOException {
        logger.info("LOAD ARTOS");
        artos = client.postJSONFromFile("/rest/GameModel", "../wegas-app/src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json", GameModel.class);
    }

    private Player getTestPlayer(GameModel gameModel) throws IOException {
        return client.get("/rest/GameModel/" + gameModel.getId() + "/TestPlayer", Player.class);
    }

    @Test
    public void testDatabaseIndexes() {
        final String DB_CON = "jdbc:postgresql://localhost:5432/wegas_test";
        final String USER = "user";
        final String PASSWORD = "1234";
        try ( Connection connection = DriverManager.getConnection(DB_CON, USER, PASSWORD);  Statement st = connection.createStatement()) {
            Assert.assertEquals("Some indexes are missing. Please create liquibase changesets. See log for details",
                    0, TestHelper.getMissingIndexesCount(st));
        } catch (SQLException ex) {
        }
    }

    private String getArtosBaseURL() {
        return "/rest/Editor/GameModel/" + artos.getId();
    }

    @Test
    public void testCacheCoordination() throws IOException {
        String artosUrl = getArtosBaseURL();

        Player testPlayer = getTestPlayer(artos);

        String runURL = artosUrl + "/VariableDescriptor/Script/Run/" + testPlayer.getId();

        client.login(root);
        client2.login(root);

        // Load managementApproval on both instances
        Script fetchVar = new Script("JavaScript", "Variable.find(gameModel, 'managementApproval');");
        NumberDescriptor var1 = client.post(runURL, fetchVar, NumberDescriptor.class);
        NumberDescriptor var2 = client2.post(runURL, fetchVar, NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", var1.getMinValue(), var2.getMinValue(), 0.001);

        // update min bound on instance #1
        var1.setMinValue(-100.0);
        var1 = client.put(artosUrl + "/VariableDescriptor/" + var1.getId(), var1, NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", -100, var1.getMinValue(), 0.001);

        // update the min bound in database
        // since the cache is active, this value will not be read again, unless the cache is wiped out
        final String DB_CON = "jdbc:postgresql://localhost:5432/wegas_test";
        final String USER = "user";
        final String PASSWORD = "1234";
        try ( Connection connection = DriverManager.getConnection(DB_CON, USER, PASSWORD);  Statement st = connection.createStatement()) {
            st.executeUpdate("UPDATE numberdescriptor SET minvalue = -9999 WHERE id = " + var1.getId());
        } catch (SQLException ex) {
        }

        // assert both instsances do not read the min bounds from database
        var1 = client.get(artosUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        var2 = client2.get(artosUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", -100, var1.getMinValue(), 0.001);
        Assert.assertEquals("Min bounds do not match", -100, var2.getMinValue(), 0.001);

        // Clear JPA l2 cache
        client.delete("/rest/Utils/LocalEmCache");
        client2.delete("/rest/Utils/LocalEmCache");

        // assert both instsances DO read the min bounds from database
        var1 = client.get(artosUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        var2 = client2.get(artosUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", -9999, var1.getMinValue(), 0.001);
        Assert.assertEquals("Min bounds do not match", -9999, var2.getMinValue(), 0.001);
    }

    @Test
    public void testCollectionChangeRecordIssue() throws IOException {
        String artosUrl = getArtosBaseURL();

        Player testPlayer = getTestPlayer(artos);

        String runURL = artosUrl + "/VariableDescriptor/Script/Run/" + testPlayer.getId();
        String assignUrl = artosUrl + "/VariableDescriptor/ResourceDescriptor/Assign/";
        String moveUrl = artosUrl + "/VariableDescriptor/ResourceDescriptor/MoveAssignment/";

        client.login(root);
        client2.login(root);

        /**
         * DELETE	/Assign/{assignmentId}
         * POST	/Assign/{resourceId}/{taskInstanceId}
         * PUT	/MoveAssignment/{assignmentId}/{index}
         */
        // Load resource and task from botch instance
        Script fetchTask1 = new Script("JavaScript", "Variable.find(gameModel, 'ChoixEnvironnementDéveloppement').getInstance(self);");
        TaskInstance task1 = client.post(runURL, fetchTask1, TaskInstance.class);

        Script fetchTask2 = new Script("JavaScript", "Variable.find(gameModel, 'AnalyseExistant').getInstance(self);");
        TaskInstance task2 = client.post(runURL, fetchTask2, TaskInstance.class);

        Script fetchResource = new Script("JavaScript", "Variable.find(gameModel, 'Gaelle').getInstance(self);");
        ResourceInstance gaelle_a = client.post(runURL, fetchResource, ResourceInstance.class);
        ResourceInstance gaelle_b = client2.post(runURL, fetchResource, ResourceInstance.class);

        Assert.assertArrayEquals(gaelle_a.getAssignments().toArray(), gaelle_b.getAssignments().toArray());

        // assign gaelle to task3, task2 and task1
        client.post(assignUrl + gaelle_a.getId() + "/" + task1.getId(), null);
        client.post(assignUrl + gaelle_a.getId() + "/" + task2.getId(), null);

        // assert both instances have the same list
        gaelle_a = client.post(runURL, fetchResource, ResourceInstance.class);
        gaelle_b = client2.post(runURL, fetchResource, ResourceInstance.class);

        Assert.assertArrayEquals(gaelle_a.getAssignments().toArray(), gaelle_b.getAssignments().toArray());

        // move assignment
        Assignment a = gaelle_a.getAssignments().get(1);
        client.put(moveUrl + a.getId() + "/0");

        // assert both instances have the same list
        gaelle_a = client.post(runURL, fetchResource, ResourceInstance.class);
        gaelle_b = client2.post(runURL, fetchResource, ResourceInstance.class);

        Assert.assertArrayEquals(gaelle_a.getAssignments().toArray(), gaelle_b.getAssignments().toArray());
    }

    @Test
    public void testStandardProcess() throws IOException {
        logger.info("root share to Scenarist");
        client.login(root);
        client.post("/rest/User/ShareGameModel/" + artos.getId() + "/View,Edit,Delete,Instantiate,Duplicate/" + scenarist.getAccountId(), null);

        logger.info("scenarist share to trainer");
        client.login(scenarist);
        List<GameModel> gameModels = client.get("/rest/GameModel/status/LIVE", new TypeReference<List<GameModel>>() {
        });

        logger.info("# gamemodels scen:" + gameModels.size());
        Assert.assertEquals(2, gameModels.size()); // Artos  + _empty
        client.post("/rest/User/ShareGameModel/" + artos.getId() + "/Instantiate/" + trainer.getAccountId(), null);

        client.login(trainer);

        gameModels = client.get("/rest/GameModel/status/LIVE", new TypeReference<List<GameModel>>() {
        });
        logger.info("# gamemodels trainer:" + gameModels.size());
        // Get
        Assert.assertEquals(2, gameModels.size()); // artos +empty

        //create a game
        Game myGame = client.postJSON_asString("/rest/GameModel/" + artos.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + artos.getId() + "\",\"access\":\"OPEN\",\"name\":\"ArtosGame\"}", Game.class);
        String token = myGame.getToken();

        List<Game> games = client.get("/rest/GameModel/Game/status/LIVE", new TypeReference<List<Game>>() {
        });
        Assert.assertEquals(1, games.size()); // artos +empty

        client.login(user);

        Game gameToJoin = client.get("/rest/GameModel/Game/FindByToken/" + token, Game.class);

        gameToJoin.setGameModel(artos); //Hack

        Team teamToCreate = new Team();
        teamToCreate.setDeclaredSize(1);
        teamToCreate.setName("myTeam");
        teamToCreate.setGame(gameToJoin);

        Team newTeam = client.post("/rest/GameModel/Game/" + gameToJoin.getId() + "/Team", teamToCreate, Team.class);

        Assert.assertEquals(Populatable.Status.LIVE, newTeam.getStatus());

        Team joinedTeam = client.post("/rest/GameModel/Game/Team/" + newTeam.getId() + "/Player", null, Team.class);
        Assert.assertEquals(1, joinedTeam.getPlayers().size());
        Assert.assertEquals(Populatable.Status.LIVE, joinedTeam.getPlayers().get(0).getStatus());

        client.login(user);

        List<Team> userTeams = client.get("/rest/User/Current/Team", new TypeReference<List<Team>>() {
        });

        Assert.assertEquals(1, userTeams.size()); // artos +empty
    }

    @Test
    public void testUpdateAndCreateGame() throws IOException {
        GameModel myGameModel = client.postJSONFromFile("/rest/GameModel", "../wegas-app/src/test/resources/gmScope.json", GameModel.class);
        Game myGame = client.postJSON_asString("/rest/GameModel/" + myGameModel.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + myGameModel.getId() + "\",\"access\":\"OPEN\",\"name\":\"My Test Game\"}", Game.class);
        myGame.getId();
    }

    @Test
    public void testModeliseStateMachine() throws IOException {
        client.get("/rest/Utils/SetLoggerLevel/com.wegas.core.ejb.ModelFacade/DEBUG");

        GameModel gm1 = client.postJSONFromFile("/rest/GameModel", "../wegas-app/src/test/resources/fsm.json", GameModel.class);
        GameModel gm2 = client.postJSONFromFile("/rest/GameModel", "../wegas-app/src/test/resources/fsm.json", GameModel.class);

        // create model
        GameModel model = client.postJSON_asString("/rest/GameModel/extractModel/" + gm1.getId() + "," + gm2.getId(),
                "{\"@class\":\"GameModel\",\"name\":\"ModelFSM\"}", GameModel.class);

        GameModel gm = client.put("/rest/GameModel/" + model.getId() + "/Propagate", null, GameModel.class);
    }

    @Test
    public void createGameTest() throws IOException {
        Game myGame = client.postJSON_asString("/rest/GameModel/" + this.artos.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + this.artos.getId() + "\",\"access\":\"OPEN\",\"name\":\"My Artos Game\"}", Game.class);

        /* Use Editor view to load teams: */
        Game myGameFromGet = client.get("/rest/Editor/GameModel/Game/" + myGame.getId(), Game.class);


        /* Is the debug team present */
        Assert.assertEquals(1, myGameFromGet.getTeams().size());
        Assert.assertEquals(1, myGameFromGet.getTeams().get(0).getPlayers().size());
    }

    @Test
    public void getVariableDescriptor() throws IOException {
        List<VariableDescriptor> descs;

        descs = (List<VariableDescriptor>) (client.get("/rest/GameModel/" + this.artos.getId() + "/VariableDescriptor", new TypeReference<List<VariableDescriptor>>() {
        }));

        Assert.assertTrue("Seems there is not enough descriptor here...", descs.size() > 10);
    }

    @Test
    public void manageModeTest() throws IOException {
        List<GameModel> get = (List<GameModel>) client.get("/rest/GameModel", new TypeReference<List<GameModel>>() {
        });
        get.size();
    }

    @Test
    public void hello() throws IOException {
        WebClient webClient = new WebClient();
        final HtmlPage page = webClient.getPage(client.getBaseURL() + "/login.html?debug=true");

        Assert.assertEquals(200, page.getWebResponse().getStatusCode());

        Assert.assertEquals("Web Game Authoring System - Wegas", page.getTitleText());

        //tester.setTextField("username", "root@root.com");
        //tester.setTextField("password", "1234");
        //tester.clickLink("login");
        //tester.submit();
    }

    //@Test
    public void testJavascript() throws IOException {
        WebClient webClient = new WebClient();
        webClient.getOptions().setJavaScriptEnabled(true);

        //webClient.setAjaxController(new NicelyResynchronizingAjaxController());
        HtmlPage page = webClient.getPage(client.getBaseURL() + "/wegas-app/tests/wegas-alltests.htm");
        //webClient.waitForBackgroundJavaScriptStartingBefore(30000);

        Assert.assertEquals("Wegas Test Suite", page.getTitleText());
        DomElement domPassed = page.getElementById("passed");
        DomElement domTotal = page.getElementById("total");

        String pContent = domPassed.getTextContent();
        String tContent = domTotal.getTextContent();

        logger.info("TESTS:  " + pContent + "/" + tContent);
    }

}
