/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.Context;
import javax.naming.NamingException;
import javax.persistence.EntityTransaction;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
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
    protected static EntityTransaction tx;
    protected static EJBContainer ejbContainer;
    protected static Context context;
    protected static GameModelFacade gameModelFacade;
    // *** Fields *** //
    protected GameModel gameModel;
    protected Game game;
    protected Team team;
    protected Player player;
    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @BeforeClass
    public static void setUp() throws NamingException {
        logger.info("Set up context...");

        Map<String, Object> properties = new HashMap<>();
        properties.put(EJBContainer.MODULES, new File[]{new File("target/classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");

        ejbContainer = EJBContainer.createEJBContainer(properties);
        context = ejbContainer.getContext();
        gameModelFacade = lookupBy(GameModelFacade.class, GameModelFacade.class);
    }

    @AfterClass
    public static void tearDown() {
        ejbContainer.close();
        //logger.info("Closing the container");
    }

    @Before
    public void before() throws NamingException {
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
        player.setName("test-player");
        team.addPlayer(player);

        gameModelFacade.create(gameModel);
    }

    @After
    public void after() {
        gameModelFacade.remove(gameModel);
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return Helper.lookupBy(context, type, service);
    }
}
