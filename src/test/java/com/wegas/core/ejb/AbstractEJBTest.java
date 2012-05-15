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

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
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
    protected GameModelEntity gameModel;
    protected GameEntity game;
    protected TeamEntity team;
    protected PlayerEntity player;
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
        gameModel = new GameModelEntity();
        gameModel.setName("test-gamemodel");

        game = new GameEntity();
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        gameModel.addGame(game);

        team = new TeamEntity();
        team.setName("test-team");
        game.addTeam(team);

        player = new PlayerEntity();
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
