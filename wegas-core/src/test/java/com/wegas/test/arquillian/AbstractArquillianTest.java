/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.test.arquillian;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.rest.UserController;
import java.sql.SQLException;
import jakarta.inject.Inject;
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
public abstract class AbstractArquillianTest extends AbstractArquillianTestMinimal {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractArquillianTest.class);

    @Inject
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

    protected WegasUser scenarist;
    protected WegasUser trainer;
    protected WegasUser user;
    protected WegasUser guest;

    //
    protected Team team2 = null;
    protected Player player21 = null;
    protected Player player22 = null;

    protected WegasUser user21 = null;
    protected WegasUser user22 = null;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @Before
    public void populate() throws CloneNotSupportedException {
        scenarist = this.signup("scenarist@local");
        trainer = this.signup("trainer@local");
        user = this.signup("user@local");
        user21 = this.signup("user21@local");
        user22 = this.signup("user22@local");

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

        player = gameFacade.joinTeam(team.getId(), user.getId(), null);

        login(admin);
        this.initTime = System.currentTimeMillis();
        requestManager.clearEntities();
    }

    /**
     * Create a second team (team2).
     * Create two users: user21 and 22.
     * The team2 twice : player21, player22
     */
    protected void createSecondTeam() {
        login(user21);
        team2 = new Team();
        team2.setName("test-team2");

        teamFacade.create(game.getId(), team2);

        login(user21);
        player21 = gameFacade.joinTeam(team2.getId(), user21.getId(), null);

        login(user22);
        player22 = gameFacade.joinTeam(team2.getId(), user22.getId(), null);

        login(admin);
    }

    public void reseAndSetUpDB() throws SQLException, NamingException, WegasNoResultException, CloneNotSupportedException {
        this.init();
        this.populate();
    }
}
