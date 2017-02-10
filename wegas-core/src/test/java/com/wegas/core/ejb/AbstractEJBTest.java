/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class AbstractEJBTest extends AbstractEJBTestBase {

    // *** Static *** //
    private static final Logger logger = LoggerFactory.getLogger(AbstractEJBTest.class);

    /**
     * A LIVE gameModel
     */
    protected static GameModel gameModel;
    /**
     * A PLAY gameModel
     */
    protected static GameModel scenario;
    /**
     * a game based on scenario
     */
    protected static Game game;
    protected static Team team;
    protected static Player player;
    protected static Team team2;
    protected static Player player2;
    protected static Player player21;

    protected static User admin;
    protected static User scenarist;
    protected static User trainer;
    protected static User user;
    protected static User guest;

    protected User user2;
    protected User user21;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @BeforeClass
    public static final void setUp() throws NamingException {
        Role admins = new Role("Administrator");
        admins.addPermission("GameModel:*:*");
        admins.addPermission("Game:*:*");
        admins.addPermission("User:*:*");

        roleFacade.create(admins);

        admin = AbstractEJBTest.signup("admin@local");
        login(admin);

        admin = addRoles(admin, admins);

        //Role guests = new Role("Guest");
        Role registered = new Role("Registered");
        Role scenarists = new Role("Scenarist");
        Role trainers = new Role("Trainer");
        Role publicRole = new Role("Public");

        roleFacade.create(scenarists);
        roleFacade.create(trainers);
        //roleFacade.create(registered);
        //roleFacade.create(publicRole);
        //roleFacade.create(guests);

        //rm.getEntityManager().getEntityManagerFactory().getCache().evictAll();
        securityFacade.clearPermissions();

        scenarist = AbstractEJBTest.signup("scenarist@local");
        trainer = AbstractEJBTest.signup("trainer@local");
        user = AbstractEJBTest.signup("user@local");

        scenarist = addRoles(scenarist, scenarists);
        trainer = addRoles(trainer, trainers);

        /*
        scenarist = addRoles(scenarist, scenarists, registered, publicRole);
        trainer = addRoles(trainer, trainers, registered, publicRole);
        user = addRoles(user, registered, publicRole);
         */
        userFacade.logout();

        guest = AbstractEJBTest.guestLogin();
    }

    /**
     * Create a GameModel and a game with two teams (test-team and test-team2),
     * with, respectively, one and two players ("Player", "Player2", and
     * "Player21").
     *
     */
    @Before
    public void createGameModel() throws IOException {
        login(admin);

        login(scenarist);
        gameModel = new GameModel();
        gameModel.setName("test-gamemodel");
        gameModelFacade.create(gameModel);
        gameModel = gameModelFacade.find(gameModel.getId());

        userFacade.addAccountPermission(trainer.getMainAccount().getId(), "GameModel:Instantiate:gm" + gameModel.getId());

        login(trainer);
        game = new Game();
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        game.setAccess(Game.GameAccess.OPEN);
        //gameFacade.create(scenario.getId(), game);
        gameFacade.publishAndCreate(gameModel.getId(), game);
        scenario = gameModelFacade.find(game.getGameModelId());
        game = gameFacade.find(game.getId());

        login(user);
        team = new Team();
        team.setName("test-team");
        teamFacade.create(game.getId(), team);

        player = gameFacade.joinTeam(team.getId(), user.getId());

        team2 = new Team();
        team2.setName("test-team2");

        teamFacade.create(game.getId(), team2);

        login(admin);
        user2 = AbstractEJBTest.signup("user2@local");
        login(user2);
        player2 = gameFacade.joinTeam(team2.getId(), user2.getId());

        logout();
        user21 = AbstractEJBTest.signup("user21@local");
        login(user21);
        player21 = gameFacade.joinTeam(team2.getId(), user21.getId());

        login(admin);
        requestManager.setPlayer(player);
    }

    @After
    public void clear() throws NamingException {
        login(admin);
        TestHelper.wipeEmCache();
        requestManager.setPlayer(null);
        requestManager.clearUpdatedEntities();
        gameModelFacade.remove(scenario.getId());
        TestHelper.wipeEmCache();
        userFacade.remove(user2.getId());
        userFacade.remove(user21.getId());

        securityFacade.clearPermissions();

        userFacade.logout();
    }
}
