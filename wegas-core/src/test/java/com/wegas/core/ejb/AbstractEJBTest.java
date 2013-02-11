/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author fx
 */
public class AbstractEJBTest {
    // *** Static *** //

    protected static final Logger logger = LoggerFactory.getLogger(AbstractEJBTest.class);
    protected static EJBContainer ejbContainer;
    protected static GameModelFacade gameModelFacade;
    // *** Fields *** //
    protected static GameModel gameModel;
    protected static Game game;
    protected static Team team;
    protected static Player player;
    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";


    @BeforeClass
    public static void setUp() throws NamingException {
        ejbContainer = TestHelper.getEJBContainer();
        gameModelFacade = lookupBy(GameModelFacade.class, GameModelFacade.class);

        //ejbContainer.getContext().rebind("inject", this);

        gameModel = new GameModel();
        gameModel.setName("test-gamemodel");

        game = new Game();
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        gameModel.addGame(game);

        team = new Team();
        team.setName("test-team");
        game.addTeam(team);

        player = new Player();
        team.addPlayer(player);

        gameModelFacade.create(gameModel);
    }

    @AfterClass
    public static void tearDown() {
        gameModelFacade.remove(gameModel.getId());
        ejbContainer.close();
        //logger.info("Closing the container");
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, service);
    }

    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, type);
    }
}
