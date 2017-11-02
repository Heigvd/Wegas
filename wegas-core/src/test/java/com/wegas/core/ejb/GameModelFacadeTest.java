/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.test.TestHelper;
import com.wegas.core.persistence.game.*;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.function.Function;
import javax.naming.NamingException;
import org.eu.ingwar.tools.arquillian.extension.suite.annotations.ArquillianSuiteDeployment;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@ArquillianSuiteDeployment
public class GameModelFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(GameModelFacadeTest.class);
    private int nbFail = 0;

    @Test
    public void createGameModels() throws NamingException {
        logger.info("createGameModel()");
        final String name = "test";
        final String SCRIPTNAME = "defaultScript";
        final String SCRIPTCONTENT = "test";

        GameModel gameModel = new GameModel();
        gameModel.setName(name);
        gameModel.getClientScriptLibraryList().add(new GameModelContent(SCRIPTNAME, SCRIPTCONTENT, ""));
        gameModel.getScriptLibraryList().add(new GameModelContent(SCRIPTNAME, SCRIPTCONTENT, ""));
        gameModel.getCssLibraryList().add(new GameModelContent(SCRIPTNAME, SCRIPTCONTENT, ""));
        gameModel.getProperties().setPagesUri(SCRIPTCONTENT);

        final int size = gameModelFacade.findAll().size();
        gameModelFacade.create(gameModel);
        Assert.assertEquals(size + 1, gameModelFacade.findAll().size());

        gameModel = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(name, gameModel.getName());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getClientScript(SCRIPTNAME).getContent());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getProperties().getPagesUri());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getCss(SCRIPTNAME).getContent());
        Assert.assertEquals(SCRIPTCONTENT, gameModel.getScript(SCRIPTNAME).getContent());

        gameModelFacade.remove(gameModel.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }

    @Test
    public void createGame() throws NamingException {
        logger.info("createGame()");
        final String GAMENAME = "test-gamemodel";
        final String GAMENAME2 = "test-gamemodel2";
        final String NAME = "test-game";
        final String TOKEN = "token-for-testGame";

        // Create a game model
        GameModel gameModel = new GameModel(GAMENAME);
        final int size = gameModelFacade.findAll().size();
        gameModelFacade.create(gameModel);
        Assert.assertEquals(size + 1, gameModelFacade.findAll().size());

        GameModel gameModel1 = new GameModel(GAMENAME2);
        gameModel1.getProperties().setGuestAllowed(true);
        // Change Name and guestAllowed properties
        GameModel gm2 = gameModelFacade.update(gameModel.getId(), gameModel1);
        Assert.assertEquals(GAMENAME2, gm2.getName());

        // Create a game, a team and a player
        Game g = new Game(NAME, TOKEN);
        gameFacade.create(gameModel.getId(), g);

        Game g2 = gameFacade.findByToken(TOKEN);
        Assert.assertEquals(NAME, g2.getName());

        Team t = new Team();
        t.setName("test-team");
        teamFacade.create(g.getId(), t);
        Assert.assertNotNull(t.getId());

        Player p = gameFacade.joinTeam(t.getId(), "John A. Player");

        Assert.assertNotNull(p.getId());

        gameModelFacade.remove(gameModel.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }

    @Test
    public void createMultipleTeam_threaded() throws NamingException, InterruptedException {

        nbFail = 0;

        Thread.UncaughtExceptionHandler handler = (Thread t, Throwable e) -> {
            nbFail++;
        };

        final int size = gameModelFacade.findAll().size();

        GameModel gameModel = new GameModel("TESTGM");
        gameModel.getProperties().setGuestAllowed(true);
        gameModelFacade.create(gameModel);

        Game g = new Game("TESTGAME", "xxx");
        gameFacade.create(gameModel.getId(), g);
        Team t1 = new Team();
        Team t2 = new Team();
        t1.setName("test-team");
        t2.setName("test-team");
        final Function<Team, Runnable> runCreateTeam = (Team t) -> () -> teamFacade.create(g.getId(), t);

        final Thread thread1 = TestHelper.start(runCreateTeam.apply(t1), handler);
        final Thread thread2 = TestHelper.start(runCreateTeam.apply(t2), handler);
        thread1.join();
        thread2.join();
        Assert.assertEquals(1, nbFail);
        //Assert.assertFalse(t1.getName().equals(t2.getName()));
        Assert.assertEquals(size + 1, gameModelFacade.findAll().size());

        gameModelFacade.remove(gameModel.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }

    @Test
    public void createMultipleTeam_seq() throws NamingException, InterruptedException {
        final int size = gameModelFacade.findAll().size();

        GameModel gameModel = new GameModel("TESTGM");
        gameModelFacade.create(gameModel);

        Game g = new Game("TESTGAME", "xxx");
        gameFacade.create(gameModel.getId(), g);
        Team t1 = new Team();
        Team t2 = new Team();
        t1.setName("test-team");
        t2.setName("test-team");

        try {
            teamFacade.create(g.getId(), t1);

            teamFacade.create(g.getId(), t1);
        } catch (Exception e) {
            System.out.println("ERROR: " + e);
        }

        Assert.assertEquals(size + 1, gameModelFacade.findAll().size());

        gameModelFacade.remove(gameModel.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }
}
