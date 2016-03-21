/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.*;
import com.wegas.core.security.ejb.UserFacade;
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
        ejbContainer = TestHelper.getEJBContainer();
        context = ejbContainer.getContext();
        gameModelFacade = lookupBy(GameModelFacade.class);
        lookupBy(UserFacade.class).guestLogin();
    }

    @AfterClass
    public static void tearDown() {
        TestHelper.closeContainer();
    }

    @Test
    public void createGameModel() throws NamingException {
        logger.info("createGameModel()");
        final String name = "test";
        final String SCRIPTNAME = "defaultScript";
        final String SCRIPTCONTENT = "test";

        GameModel gameModel = new GameModel();
        gameModel.setName(name);
        gameModel.getClientScriptLibrary().put(SCRIPTNAME, new GameModelContent(SCRIPTCONTENT));
        gameModel.getScriptLibrary().put(SCRIPTNAME, new GameModelContent(SCRIPTCONTENT));
        gameModel.getCssLibrary().put(SCRIPTNAME, new GameModelContent(SCRIPTCONTENT));
        gameModel.getProperties().setPagesUri(SCRIPTCONTENT);

        gameModelFacade.create(gameModel);
        Assert.assertEquals(1, gameModelFacade.findAll().size());

        gameModel = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(name, gameModel.getName());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getClientScriptLibrary().get(SCRIPTNAME).getContent());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getProperties().getPagesUri());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getCssLibrary().get(SCRIPTNAME).getContent());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getScriptLibrary().get(SCRIPTNAME).getContent());

        gameModelFacade.remove(gameModel.getId());
        Assert.assertEquals(0, gameModelFacade.findAll().size());
    }

    @Test
    public void createGame() throws NamingException {
        logger.info("createGame()");
        final String GAMENAME = "test-gamemodel";
        final String GAMENAME2 = "test-gamemodel2";
        final String NAME = "test-game";
        final String TOKEN = "test-game-token";

        GameFacade gf = lookupBy(GameFacade.class);
        TeamFacade tf = lookupBy(TeamFacade.class);
        PlayerFacade pf = lookupBy(PlayerFacade.class);

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

        Game g2 = gf.findByToken(TOKEN);
        Assert.assertEquals(NAME, g2.getName());

        Team t = new Team();
        t.setName("test-team");
        tf.create(g.getId(), t);
        Assert.assertNotNull(t.getId());

        Player p = new Player();

        pf.create(t.getId(), p);
        Assert.assertNotNull(p.getId());

        gameModelFacade.remove(gameModel.getId());
    }

    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(context, type);
    }
}
