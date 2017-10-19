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
import java.io.IOException;
import java.sql.SQLException;
import org.junit.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;

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
    protected GameModel gameModel;
    /**
     * A PLAY gameModel
     */
    protected GameModel scenario;
    /**
     * a game based on scenario
     */
    protected Game game;
    protected Team team;
    protected Player player;
    protected Team team2;
    protected Player player21;
    protected Player player22;

    protected WegasUser scenarist;
    protected WegasUser trainer;
    protected WegasUser user;
    protected WegasUser guest;

    protected WegasUser user11;
    protected WegasUser user21;
    protected WegasUser user22;

    protected WegasUser user31;
    protected WegasUser user32;
    protected WegasUser user33;
    protected WegasUser user34;

    protected WegasUser user41;
    protected WegasUser user42;
    protected WegasUser user43;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";
    
    @Before
    public final void setUp() throws NamingException, WegasNoResultException, SQLException, IOException {

        //rm.getEntityManager().getEntityManagerFactory().getCache().evictAll();
        //requestManager.clearPermissions();
        scenarist = AbstractEJBTest.signup("scenarist@local");
        trainer = AbstractEJBTest.signup("trainer@local");
        user = AbstractEJBTest.signup("user@local");

        user11 = AbstractEJBTest.signup("user11@local");

        user21 = AbstractEJBTest.signup("user21@local");
        user22 = AbstractEJBTest.signup("user22@local");

        user31 = AbstractEJBTest.signup("user31@local");
        user32 = AbstractEJBTest.signup("user32@local");
        user33 = AbstractEJBTest.signup("user33@local");
        user34 = AbstractEJBTest.signup("user34@local");

        user41 = AbstractEJBTest.signup("user41@local");
        user43 = AbstractEJBTest.signup("user43@local");
        user42 = AbstractEJBTest.signup("user42@local");

        login(admin);
        scenarist = addRoles(scenarist, scenarists);
        trainer = addRoles(trainer, trainers);

        guest = AbstractEJBTest.guestLogin();

        login(admin);

        login(scenarist);
        gameModel = new GameModel();
        gameModel.setName("test-gamemodel");
        gameModel.getProperties().setGuestAllowed(true);
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
        login(user21);
        player21 = gameFacade.joinTeam(team2.getId(), user21.getId());

        login(user22);
        player22 = gameFacade.joinTeam(team2.getId(), user22.getId());
        login(admin);
        requestFacade.setPlayer(player.getId());
    }

    public void reseAndSetUpDB() throws NamingException, WegasNoResultException, WegasNoResultException, SQLException, IOException {
        this.resetDb();
        this.setUp();
    }
}
