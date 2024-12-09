/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.runtime;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wegas.core.persistence.game.DebugTeam;
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

import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 *
 * @author maxence
 */
@RunWith(Arquillian.class)
public class WegasTest {

    @Rule
    public TestName name = new TestName();

    private static final String WEGAS_ROOT_DIR = "../wegas-app/";
    private static final String WEGAS_URL_1 = "http://localhost:28080/Wegas";
    private static final String WEGAS_URL_2 = "http://localhost:28081/Wegas";
    private static final String ADMIN_USERNAME = "root";
    private static final String ADMIN_EMAIL = "root@root.com";
    private static final String ADMIN_PASSWORD = "1234";


    private static final Logger logger = LoggerFactory.getLogger(WegasTest.class);

    private static WegasRESTClient client;

    private static WegasRESTClient client2;

    private static TestAuthenticationInformation root;
    private static TestAuthenticationInformation scenarist;
    private static TestAuthenticationInformation trainer;
    private static TestAuthenticationInformation user;

    GameModel dummyGameModel;

    @Deployment(name = "wegas1.war")
    //@OverProtocol("Local")
    @TargetsContainer("payara1")
    public static WebArchive deployFirst() {
        return createDeployment("Wegas1");
    }

    @Deployment(name = "wegas2.war")
    //@OverProtocol("Local")
    @TargetsContainer("payara2")
    public static WebArchive deploySecond() {
        return createDeployment("Wegas2");
    }

    public static WebArchive createDeployment(String name) {
        WegasRuntime.resetDB("wegas_test");
        String warPath;
        warPath = WEGAS_ROOT_DIR + "target/Wegas";

        WebArchive war = ShrinkWrap.create(ExplodedImporter.class, name + ".war")
            .importDirectory(new File(warPath))
            .as(WebArchive.class);

        return war;
    }

    @BeforeClass
    public static void setUpClass() throws IOException {
        client = new WegasRESTClient(WEGAS_URL_1);
        client2 = new WegasRESTClient(WEGAS_URL_2);

        scenarist = client.signup("scenarist@local", "1234");
        trainer = client.signup("trainer@local", "1234");
        user = client.signup("user@local", "1234");

        root = client.getAuthInfo(ADMIN_EMAIL, ADMIN_PASSWORD);
        root.setUserId(1l);

        client.login(root);
        grantRights();
        logger.info("SETUP COMPLETED");
    }

    @Before
    public void setUp() throws IOException {
        logger.info("TEST {}", name.getMethodName());
        logger.info("LOGIN as root");
        client.login(root);
        client.get("/rest/Utils/SetPopulatingSynchronous");
        loadDummyGameModel();
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
        Role scenaristRole = roles.get("Scenarist");
        Role trainerRole = roles.get("Trainer");

        client.put("/rest/User/" + scenUser.getId() + "/Add/" + scenaristRole.getId());
        client.put("/rest/User/" + scenUser.getId() + "/Add/" + trainerRole.getId());

        User trainerUser = client.get("/rest/User/" + trainer.getUserId(), User.class);
        client.put("/rest/User/" + trainerUser.getId() + "/Add/" + trainerRole.getId());
    }

    private void loadDummyGameModel() throws IOException {
        logger.info("LOAD DUMMY GAME-MODEL");
        dummyGameModel = client.postJSONFromFile("/rest/GameModel", "./src/test/resources/dummy.json", GameModel.class);
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

    private String getDummyBaseURL() {
        return "/rest/Editor/GameModel/" + dummyGameModel.getId();
    }

    @Test
    public void testCacheCoordination() throws IOException {
        String dummGmUrl = getDummyBaseURL();

        Player testPlayer = getTestPlayer(dummyGameModel);

        String runURL = dummGmUrl + "/VariableDescriptor/Script/Run/" + testPlayer.getId();

        client.login(root);
        client2.login(root);

        // Load managementApproval on both instances
        Script fetchVar = new Script("JavaScript", "Variable.find(gameModel, 'aBoundedNumber');");
        NumberDescriptor var1 = client.post(runURL, fetchVar, NumberDescriptor.class);
        NumberDescriptor var2 = client2.post(runURL, fetchVar, NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", var1.getMinValue(), var2.getMinValue(), 0.001);

        // update min bound on instance #1
        var1.setMinValue(-100.0);
        var1 = client.put(dummGmUrl + "/VariableDescriptor/" + var1.getId(), var1, NumberDescriptor.class);
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
        var1 = client.get(dummGmUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        var2 = client2.get(dummGmUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", -100, var1.getMinValue(), 0.001); //client has value set l.204
        Assert.assertEquals("Min bounds do not match", -9999, var2.getMinValue(), 0.001); //client2 has no value, with INVALIDATE_CHANGED_OBJECTS, data is loaded from DB, with SEND_OBJECT_CHANGES(default) value is sent from first instance

        // Clear JPA l2 cache
        client.delete("/rest/Utils/LocalEmCache");
        client2.delete("/rest/Utils/LocalEmCache");

        // assert both instsances DO read the min bounds from database
        var1 = client.get(dummGmUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        var2 = client2.get(dummGmUrl + "/VariableDescriptor/" + var1.getId(), NumberDescriptor.class);
        Assert.assertEquals("Min bounds do not match", -9999, var1.getMinValue(), 0.001);
        Assert.assertEquals("Min bounds do not match", -9999, var2.getMinValue(), 0.001);
    }

    @Test
    public void testCollectionChangeRecordIssue() throws IOException {
        String dummyGmUrl = getDummyBaseURL();

        Player testPlayer = getTestPlayer(dummyGameModel);

        String runURL = dummyGmUrl + "/VariableDescriptor/Script/Run/" + testPlayer.getId();
        String assignUrl = dummyGmUrl + "/VariableDescriptor/ResourceDescriptor/Assign/";
        String moveUrl = dummyGmUrl + "/VariableDescriptor/ResourceDescriptor/MoveAssignment/";

        client.login(root);
        client2.login(root);

        // DELETE /Assign/{assignmentId}
        // POST   /Assign/{resourceId}/{taskInstanceId}
        // PUT    /MoveAssignment/{assignmentId}/{index}

        // Load resource and task from botch instance
        Script fetchTask1 = new Script("JavaScript", "Variable.find(gameModel, 'analyse').getInstance(self);");
        TaskInstance task1 = client.post(runURL, fetchTask1, TaskInstance.class);

        Script fetchTask2 = new Script("JavaScript", "Variable.find(gameModel, 'implementation').getInstance(self);");
        TaskInstance task2 = client.post(runURL, fetchTask2, TaskInstance.class);

        Script fetchResource = new Script("JavaScript", "Variable.find(gameModel, 'john').getInstance(self);");
        ResourceInstance john_a = client.post(runURL, fetchResource, ResourceInstance.class);
        ResourceInstance john_b = client2.post(runURL, fetchResource, ResourceInstance.class);

        Assert.assertArrayEquals(john_a.getAssignments().toArray(), john_b.getAssignments().toArray());

        // assign gaelle to task3, task2 and task1
        client.post(assignUrl + john_a.getId() + "/" + task1.getId(), null);
        client.post(assignUrl + john_a.getId() + "/" + task2.getId(), null);

        // assert both instances have the same list
        john_a = client.post(runURL, fetchResource, ResourceInstance.class);
        john_b = client2.post(runURL, fetchResource, ResourceInstance.class);

        Assert.assertArrayEquals(john_a.getAssignments().toArray(), john_b.getAssignments().toArray());

        // move assignment
        Assignment a = john_a.getAssignments().get(1);
        client.put(moveUrl + a.getId() + "/0");

        // assert both instances have the same list
        john_a = client.post(runURL, fetchResource, ResourceInstance.class);
        john_b = client2.post(runURL, fetchResource, ResourceInstance.class);

        Assert.assertArrayEquals(john_a.getAssignments().toArray(), john_b.getAssignments().toArray());
    }

    private void deleteGame(Game game) throws IOException {
        client.login(root);
        client.put("/rest/GameModel/Game/" + game.getId() + "/status/DELETE");
        client.delete("/rest/GameModel/Game/" + game.getId());
    }

    @Test
    public void testStandardProcess() throws IOException {
        logger.info("root share to Scenarist");
        client.login(root);
        client.post("/rest/User/ShareGameModel/" + dummyGameModel.getId() + "/View,Edit,Delete,Instantiate,Duplicate/" + scenarist.getAccountId(), null);

        logger.info("scenarist share to trainer");
        client.login(scenarist);
        List<GameModel> gameModels = client.get("/rest/GameModel/status/LIVE", new TypeReference<List<GameModel>>() {
        });

        logger.info("# gamemodels scen:" + gameModels.size());
        Assert.assertEquals(2, gameModels.size()); // Dummy  + Empty gameModels
        client.post("/rest/User/ShareGameModel/" + dummyGameModel.getId() + "/Instantiate/" + trainer.getAccountId(), null);

        client.login(trainer);

        gameModels = client.get("/rest/GameModel/status/LIVE", new TypeReference<List<GameModel>>() {
        });
        logger.info("# gamemodels trainer:" + gameModels.size());
        // Get
        Assert.assertEquals(2, gameModels.size()); // dummyGameModel +empty

        //create a game
        Game myGame = client.postJSON_asString("/rest/GameModel/" + dummyGameModel.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + dummyGameModel.getId() + "\",\"access\":\"OPEN\",\"name\":\"DummyGame\"}", Game.class);
        String token = myGame.getToken();

        List<Game> games = client.get("/rest/GameModel/Game/status/LIVE", new TypeReference<List<Game>>() {
        });
        Assert.assertEquals(1, games.size()); // dummyGameModel +empty

        client.login(user);

        Game gameToJoin = client.get("/rest/GameModel/Game/FindByToken/" + token, Game.class);

        gameToJoin.setGameModel(dummyGameModel); //Hack

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

        Assert.assertEquals(1, userTeams.size());
        Team team = userTeams.get(0);

        // user leave
        Player deleted = client.delete("/rest/GameModel/Game/Team/" + team.getId() + "/Player/" + team.getPlayers().get(0).getId(), new TypeReference<Player>() {
        });

        userTeams = client.get("/rest/User/Current/Team", new TypeReference<List<Team>>() {
        });

        Assert.assertNull(userTeams);

        /** ************************************ CLEAN **************************************** */
        deleteGame(myGame);
    }

    @Test
    public void testTrainerDeletePlayer() throws IOException {
        logger.info("root share to Scenarist");
        client.login(root);
        client.post("/rest/User/ShareGameModel/" + dummyGameModel.getId() + "/View,Edit,Delete,Instantiate,Duplicate/" + scenarist.getAccountId(), null);

        logger.info("scenarist create a game");
        client.login(scenarist);
        List<GameModel> gameModels = client.get("/rest/GameModel/status/LIVE", new TypeReference<List<GameModel>>() {
        });

        Assert.assertTrue(gameModels.contains(dummyGameModel));
        logger.info("# gamemodels scen:" + gameModels.size());

        //create a game
        Game myGame = client.postJSON_asString("/rest/GameModel/" + dummyGameModel.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + dummyGameModel.getId() + "\",\"access\":\"OPEN\",\"name\":\"ArtosGame\"}", Game.class);
        String token = myGame.getToken();

        List<Game> games = client.get("/rest/GameModel/Game/status/LIVE", new TypeReference<List<Game>>() {
        });
        Assert.assertEquals(1, games.size()); // dummyGameModel

        // User join the game
        client.login(user);

        Game gameToJoin = client.get("/rest/GameModel/Game/FindByToken/" + token, Game.class);

        gameToJoin.setGameModel(dummyGameModel); //Hack

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

        Assert.assertEquals(1, userTeams.size()); // dummyGameModel +empty

        // scenarist delete the player
        client.login(scenarist);

        games = client.get("/rest/Editor/GameModel/Game/status/LIVE", new TypeReference<List<Game>>() {
        });
        Assert.assertEquals(1, games.size()); // dummyGameModel
        List<Team> teams = games.get(0).getTeams();
        Assert.assertEquals(2, teams.size()); // debugTeam + myTeam
        Team team = teams.stream().filter(t -> t instanceof DebugTeam == false).findFirst().get();
        List<Player> players = team.getPlayers();
        Assert.assertEquals(1, players.size()); // user

        Player deleted = client.delete("/rest/GameModel/Game/Team/"
            + teams.get(0).getId() + "/Player/" + players.get(0).getId(), new TypeReference<Player>() {
        });

        games = client.get("/rest/GameModel/Game/status/LIVE", new TypeReference<List<Game>>() {
        });
        Assert.assertEquals(1, games.size()); // dummyGameModel
        teams = games.get(0).getTeams();
        Assert.assertEquals(0, teams.size()); // myTeam

        /** ************************************ CLEAN **************************************** */
        deleteGame(myGame);
    }

    @Test
    public void testUpdateAndCreateGame() throws IOException {
        GameModel myGameModel = client.postJSONFromFile("/rest/GameModel", WEGAS_ROOT_DIR + "src/test/resources/gmScope.json", GameModel.class);
        Game myGame = client.postJSON_asString("/rest/GameModel/" + myGameModel.getId() + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + myGameModel.getId() + "\",\"access\":\"OPEN\",\"name\":\"My Test Game\"}", Game.class);
        myGame.getId();
    }

    @Test
    public void testModeliseStateMachine() throws IOException {
        client.get("/rest/Utils/SetLoggerLevel/com.wegas.core.ejb.ModelFacade/DEBUG");

        GameModel gm1 = client.postJSONFromFile("/rest/GameModel", WEGAS_ROOT_DIR + "src/test/resources/fsm.json", GameModel.class);
        GameModel gm2 = client.postJSONFromFile("/rest/GameModel", WEGAS_ROOT_DIR + "src/test/resources/fsm.json", GameModel.class);

        // create model
        GameModel model = client.postJSON_asString("/rest/GameModel/extractModel/" + gm1.getId() + "," + gm2.getId(),
            "{\"@class\":\"GameModel\",\"name\":\"ModelFSM\"}", GameModel.class);

        GameModel gm = client.put("/rest/GameModel/" + model.getId() + "/Propagate", null, GameModel.class);
    }

    @Test
    public void createGameTest() throws IOException {
        Game myGame = client.postJSON_asString("/rest/GameModel/" + this.dummyGameModel.getId() + "/Game",
            "{\"@class\":\"Game\",\"gameModelId\":\"" + this.dummyGameModel.getId() + "\",\"access\":\"OPEN\",\"name\":\"My Dummy Game\"}", Game.class);

        /* Use Editor view to load teams: */
        Game myGameFromGet = client.get("/rest/Editor/GameModel/Game/" + myGame.getId(), Game.class);


        /* Is the debug team present */
        Assert.assertEquals(1, myGameFromGet.getTeams().size());
        Assert.assertEquals(1, myGameFromGet.getTeams().get(0).getPlayers().size());
    }

    @Test
    public void getVariableDescriptor() throws IOException {
        List<VariableDescriptor> descs;

        descs = (List<VariableDescriptor>) (client.get("/rest/GameModel/" + this.dummyGameModel.getId() + "/VariableDescriptor", new TypeReference<List<VariableDescriptor>>() {
        }));
        Assert.assertEquals("Number of descriptor does not match...", 6, descs.size());
    }

    @Test
    public void manageModeTest() throws IOException {
        List<GameModel> get = (List<GameModel>) client.get("/rest/GameModel", new TypeReference<List<GameModel>>() {
        });
        get.size();
    }

    @Test
    public void testCypress() throws IOException {
        CypressTest cyTest = new CypressTest(WEGAS_URL_1,  ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, logger);
        cyTest.verifyCypress();
        cyTest.cypressSuiteTest();
    }

}
