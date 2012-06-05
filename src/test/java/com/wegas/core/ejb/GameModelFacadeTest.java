/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
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
import junit.framework.Assert;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class GameModelFacadeTest {

    private static final Logger logger = LoggerFactory.getLogger(GameModelFacadeTest.class);
    protected static EntityTransaction tx;
    private static EJBContainer ejbContainer;
    private static Context context;
    private static GameModelFacade gameModelFacade;

    @BeforeClass
    public static void setUp() throws NamingException {
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
    }

    @Test
    public void createGameModel() throws NamingException {
        logger.info("createGameModel()");
        String name = "test";

        GameModel gameModel = new GameModel();
        gameModel.setName(name);

        gameModelFacade.create(gameModel);
        Assert.assertEquals(1, gameModelFacade.findAll().size());

        gameModel = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(gameModel.getName(), name);

        gameModelFacade.remove(gameModel);
        Assert.assertEquals(0, gameModelFacade.findAll().size());
    }

    @Test
    public void createGame() throws NamingException {
        logger.info("createGame()");
        final String GAMENAME = "test-gamemodel";
        final String GAMENAME2 = "test-gamemodel2";
        final String NAME = "test-game";
        final String TOKEN = "test-game-token";
        final String NAME2 = "test-game2";
        final String TOKEN2 = "test-game-token2";
        final String VALUE = "test-value";

        GameFacade gf = lookupBy(GameFacade.class, GameFacade.class);
        TeamFacade tf = lookupBy(TeamFacade.class, TeamFacade.class);

        // Create a game model
        GameModel gameModel = new GameModel(GAMENAME);
        gameModelFacade.create(gameModel);
        Assert.assertEquals(1, gameModelFacade.findAll().size());

        // Edit this gam
        GameModel gm2 = gameModelFacade.update(gameModel.getId(), new GameModel(GAMENAME2));
        Assert.assertEquals(GAMENAME2, gm2.getName());

        // Create a game, a team and a player
        Game g = new Game(NAME, TOKEN);
        gf.create(gameModel.getId(), g);

        Game g2 = gf.getGameByToken(TOKEN);
        Assert.assertEquals(NAME, g2.getName());

        Team t = new Team();
        t.setName("test-team");
        tf.create(g.getId(), t);
        Assert.assertNotNull(t.getId());

        Player p = new Player();
        p.setName("test-player");
        tf.createPlayer(t.getId(), p);
        Assert.assertNotNull(p.getId());

        gameModelFacade.remove(gameModel);
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return Helper.lookupBy(context, type, service);
    }
}
