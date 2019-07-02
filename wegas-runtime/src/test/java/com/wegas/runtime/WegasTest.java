/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.runtime;

import com.wegas.core.exception.client.WegasWrappedException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.test.TestHelper;
import com.wegas.utils.WegasRESTClient;
import com.wegas.utils.WegasRESTClient.TestAuthenticationInformation;
import fish.payara.micro.BootstrapException;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.importer.ExplodedImporter;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
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

    private static TestAuthenticationInformation root;
    private static TestAuthenticationInformation scenarist;
    private static TestAuthenticationInformation trainer;
    private static TestAuthenticationInformation user;

    private static WegasRuntime runtime;

    GameModel artos;

    @Deployment
    public static JavaArchive createDeployment() {
        String warPath;
        warPath = "/home/maxence/Projects/Payara-Examples/payara-micro/payara-micro-examples/target/payara-micro-examples-1.0-SNAPSHOT.war";
        warPath = "../wegas-app/target/Wegas";

        JavaArchive war = ShrinkWrap.create(JavaArchive.class).
                as(ExplodedImporter.class).importDirectory(new File(warPath)).
                as(JavaArchive.class);

        return war;
    }

    @BeforeClass
    public static void setUpClass() {
        try {
            Map<String, String> env = new HashMap<>();
            env.put(WegasRuntime.WEGAS_DB_NAME_KEY, "wegas_test");
            WegasRuntime.initEnv(env);

            runtime = WegasRuntime.boot(false);

            client = new WegasRESTClient(runtime.getBaseUrl());

            scenarist = client.signup("scenarist@local", "1234");
            trainer = client.signup("trainer@local", "1234");
            user = client.signup("user@local", "1234");

            root = client.getAuthInfo("root@root.com", "1234");
            root.setUserId(1l);

            client.login(root);
            grantRights();
            logger.error("SETUP COMPLETED");
        } catch (IOException | BootstrapException ex) {
            java.util.logging.Logger.getLogger(WegasTest.class.getName()).log(Level.SEVERE, null, ex);
            throw new WegasWrappedException(ex);
        }

    }

    @Before
    public void setUp() throws IOException {
        logger.error("TEST {}", name.getMethodName());
        logger.error("LOGIN as root");
        client.login(root);
        client.get("/rest/Utils/SetPopulatingSynchronous");
        loadArtos();
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        if (runtime != null && runtime.getPayara() != null) {
            runtime.getPayara().shutdown();
        }
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

    private void loadArtos() throws IOException {
        logger.error("LOAD ARTOS");
        artos = client.postJSONFromFile("/rest/GameModel", "../wegas-app/src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json", GameModel.class);
    }

    @Test
    public void testDatabaseIndexes() {
        Assert.assertEquals("Some indexes are missing. Please create liquibase changesets. See log for details", 0, TestHelper.getMissingIndexesCount());
    }

}
