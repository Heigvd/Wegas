/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.sql.SQLException;
import org.junit.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;
import org.junit.BeforeClass;

/**
 *
 * Admin is root Scenarist owns gameModel; Trainer can instantiate gameModel.
 * game is a game based on gameModel, scenario is the gameModel copy
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class AbstractEJBTest extends AbstractEJBTestBase {

    // *** Static *** //
    protected static final Logger logger = LoggerFactory.getLogger(AbstractEJBTest.class);

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

    protected static WegasUser scenarist;
    protected static WegasUser trainer;
    protected static WegasUser user;
    protected static WegasUser guest;

    protected WegasUser user2;
    protected WegasUser user21;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @BeforeClass
    public static void setUpClass() throws NamingException {
        AbstractEJBTestBase.setUpFacades(".");
    }

    @Before
    public final void setUp() throws NamingException, WegasNoResultException, SQLException, IOException {
        login(admin);

        //rm.getEntityManager().getEntityManagerFactory().getCache().evictAll();
        //requestManager.clearPermissions();
        scenarist = AbstractEJBTest.signup("scenarist@local");
        trainer = AbstractEJBTest.signup("trainer@local");
        user = AbstractEJBTest.signup("user@local");

        scenarist = addRoles(scenarist, scenarists);
        trainer = addRoles(trainer, trainers);

        guest = AbstractEJBTest.guestLogin();

        login(admin);

        login(scenarist);
        gameModel = new GameModel();
        gameModel.setName("test-gamemodel");
        gameModelFacade.create(gameModel);
        gameModel = gameModelFacade.find(gameModel.getId());

        userController.shareGameModel(gameModel.getId(), "Instantiate", trainer.getUser().getMainAccount().getId());

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

    public void reseAndSetUpDB() throws NamingException, WegasNoResultException, WegasNoResultException, SQLException, IOException {
        this.resetDb();
        this.setUp();
    }
}
