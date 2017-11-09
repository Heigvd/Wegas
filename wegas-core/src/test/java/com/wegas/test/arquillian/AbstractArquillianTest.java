/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test.arquillian;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.persistence.User;
import org.junit.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public abstract class AbstractArquillianTest extends AbstractArquillianTestBase {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractArquillianTest.class);

    protected GameModel gameModel;
    protected Game game;
    protected Team team;
    protected Player player;
    protected Team team2;
    protected Player player2;
    protected Player player21;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @Before
    public void populate() {
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
        this.initTime = System.currentTimeMillis();
    }
}
