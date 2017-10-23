/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test.arquillian;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.HelperBean;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.TestHelper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.File;
import javax.ejb.EJB;
import javax.inject.Inject;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.importer.ExplodedImporter;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.After;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@RunWith(Arquillian.class)
public abstract class AbstractArquillianTest {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractArquillianTest.class);

    @EJB
    protected GameModelFacade gameModelFacade;

    @EJB
    protected GameFacade gameFacade;

    @EJB
    protected TeamFacade teamFacade;

    @EJB
    protected RoleFacade roleFacade;

    @EJB
    protected UserFacade userFacade;

    @EJB
    protected AccountFacade accountFacade;

    @EJB
    protected PlayerFacade playerFacade;

    @EJB
    protected VariableDescriptorFacade variableDescriptorFacade;

    @EJB
    protected VariableInstanceFacade variableInstanceFacade;

    @EJB
    protected ScriptFacade scriptFacade;

    @Inject
    private HelperBean helperBean;

    @EJB
    protected RequestFacade requestFacade;

    @Inject
    protected RequestManager requestManager;

    @Inject
    private PopulatorScheduler populatorScheduler;

    protected GameModel gameModel;
    protected Game game;
    protected Team team;
    protected Player player;
    protected Team team2;
    protected Player player2;
    protected Player player21;
    protected User guest;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @Deployment
    public static JavaArchive createDeployement() {
        JavaArchive war = ShrinkWrap.create(JavaArchive.class).
                as(ExplodedImporter.class).importDirectory(new File("target/embed-classes/")).
                as(JavaArchive.class);

        //war.addPackages(true, "com.wegas");
        //war.addAsDirectory("target/embed-classes/");
        //war.addAsResource("./src/test/resources/META-INF/persistence.xml", "META-INF/persistence.xml");
        logger.error("MyWegasArchive: {}", war.toString(true));

        String clusterNameKey = "wegas.hazelcast.clustername";
        String clusterName = "hz_wegas_test_cluster_" + Helper.genToken(5);
        System.setProperty(clusterNameKey, clusterName);

        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());

        return war;
    }

    private void setSynchronous() {
        populatorScheduler.setBroadcast(false);
        populatorScheduler.setAsync(false);
    }

    @Before
    public void populate() {
        this.setSynchronous();

        guest = userFacade.guestLogin();
        requestManager.setCurrentUser(guest);

        gameModel = new GameModel();
        gameModel.setName("test-gamemodel");
        gameModel.getProperties().setGuestAllowed(true);
        gameModelFacade.create(gameModel);

        game = new Game();
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        game.setAccess(Game.GameAccess.OPEN);
        gameFacade.create(gameModel.getId(), game);

        team = new Team();
        team.setName("test-team");
        teamFacade.create(game.getId(), team);

        player = gameFacade.joinTeam(team.getId(), guest.getId());

        team2 = new Team();
        team2.setName("test-team2");

        teamFacade.create(game.getId(), team2);

        User user2 = new User();
        userFacade.create(user2);
        player2 = gameFacade.joinTeam(team2.getId(), user2.getId());

        User user21 = new User();
        userFacade.create(user21);
        player21 = gameFacade.joinTeam(team2.getId(), user21.getId());

        requestFacade.setPlayer(player.getId());
    }

    @After
    public void clean() {
        requestManager.setPlayer(null);
        requestManager.clearUpdatedEntities();
        requestManager.clearDestroyedEntities();
        requestManager.clearOutdatedEntities();
        TestHelper.cleanData();
        helperBean.wipeCache();
    }

    protected void wipeEmCache() {
        this.helperBean.wipeCache();
    }
}
