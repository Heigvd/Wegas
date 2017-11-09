/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test.arquillian;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.rest.UserController;
import java.io.IOException;
import java.sql.SQLException;
import javax.ejb.EJB;
import javax.naming.NamingException;
import org.junit.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Admin is root; Scenarist owns gameModel; Trainer can instantiate gameModel.
 * game is a game based on gameModel, scenario is the gameModel copy
 *
 * @author maxence
 */
public abstract class AbstractArquillianTest extends AbstractArquillianTestBase {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractArquillianTest.class);

    @EJB
    private UserController userController;

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
    public void populate() throws IOException {
        scenarist = this.signup("scenarist@local");
        trainer = this.signup("trainer@local");
        user = this.signup("user@local");

        user11 = this.signup("user11@local");

        user21 = this.signup("user21@local");
        user22 = this.signup("user22@local");

        user31 = this.signup("user31@local");
        user32 = this.signup("user32@local");
        user33 = this.signup("user33@local");
        user34 = this.signup("user34@local");

        user41 = this.signup("user41@local");
        user43 = this.signup("user43@local");
        user42 = this.signup("user42@local");

        login(admin);
        scenarist = addRoles(scenarist, scenarists);
        trainer = addRoles(trainer, trainers);

        guest = this.guestLogin();

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
        this.initTime = System.currentTimeMillis();
    }

    public void reseAndSetUpDB() throws SQLException, NamingException, WegasNoResultException, IOException {
        this.init();
        this.populate();
    }
}
