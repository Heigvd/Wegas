/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.*;
import com.wegas.test.TestHelper;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import fish.payara.security.oauth2.OAuth2AuthenticationMechanism;
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
public class GameModelFacadeTest extends AbstractArquillianTestMinimal {

    private static final Logger logger = LoggerFactory.getLogger(GameModelFacadeTest.class);
    private int nbFail = 0;

    @Test
    public void createGameModels() throws NamingException {
        logger.info("createGameModel()");
        final String name = "test";
        final String SERVER_SCRIPTNAME = "defaultScript";
        final String CLIENT_SCRIPTNAME = "defaultClientScript";
        final String CSS_NAME = "defaultCss";

        final String SERVER_SCRIPTCONTENT = "var test = 'server'";
        final String CLIENT_SCRIPTCONTENT = "var test = 'client'";
        final String CSS_CONTENT = "body {color: hotpink;}";

        final String PAGE_URI = "/bidule/pages.json";

        GameModel myGameModel = new GameModel();
        myGameModel.setName(name);
        myGameModel.setClientScript(new GameModelContent(CLIENT_SCRIPTNAME, CLIENT_SCRIPTCONTENT, ""));
        myGameModel.setScript(new GameModelContent(SERVER_SCRIPTNAME, SERVER_SCRIPTCONTENT, ""));
        myGameModel.setCss(new GameModelContent(CSS_NAME, CSS_CONTENT, ""));
        myGameModel.getProperties().setPagesUri(PAGE_URI);

        final int size = gameModelFacade.findAll().size();
        gameModelFacade.create(myGameModel);
        Assert.assertEquals(size + 1, gameModelFacade.findAll().size());

        myGameModel = gameModelFacade.find(myGameModel.getId());
        Assert.assertEquals(name, myGameModel.getName());
        Assert.assertEquals(CLIENT_SCRIPTCONTENT, myGameModel.getClientScript(CLIENT_SCRIPTNAME).getContent());
        Assert.assertEquals(PAGE_URI, myGameModel.getProperties().getPagesUri());
        Assert.assertEquals(CSS_CONTENT, myGameModel.getCss(CSS_NAME).getContent());
        Assert.assertEquals(SERVER_SCRIPTCONTENT, myGameModel.getScript(SERVER_SCRIPTNAME).getContent());

        gameModelFacade.remove(myGameModel.getId());
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
        GameModel gm = new GameModel(GAMENAME);
        final int size = gameModelFacade.findAll().size();
        gameModelFacade.create(gm);
        Assert.assertEquals(size + 1, gameModelFacade.findAll().size());
        gm.setName(GAMENAME2);

        // Edit this gam
        gm.getProperties().setGuestAllowed(true);
        gm.setName(GAMENAME2);
        // Change Name and guestAllowed properties
        GameModel gm2 = gameModelFacade.update(gm.getId(), gm);
        Assert.assertEquals(GAMENAME2, gm2.getName());

        // Create a game, a team and a player
        Game g = new Game(NAME, TOKEN);
        gameFacade.create(gm.getId(), g);

        Game g2 = gameFacade.findByToken(TOKEN);
        Assert.assertEquals(NAME, g2.getName());

        Team t = new Team();
        t.setName("test-team");
        teamFacade.create(g.getId(), t);
        Assert.assertNotNull(t.getId());

        Player p = gameFacade.joinTeam(t.getId(), null);

        Assert.assertNotNull(p.getId());

        gameModelFacade.remove(gm.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }

    @Test
    public void createMultipleTeam_threaded() throws NamingException, InterruptedException {

        nbFail = 0;

        Thread.UncaughtExceptionHandler handler = (Thread t, Throwable e) -> {
            nbFail++;
        };

        final int size = gameModelFacade.findAll().size();

        GameModel myGameModel = new GameModel("TESTGM");
        myGameModel.getProperties().setGuestAllowed(true);
        gameModelFacade.create(myGameModel);

        Game g = new Game("TESTGAME", "xxx");
        gameFacade.create(myGameModel.getId(), g);
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

        gameModelFacade.remove(myGameModel.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }

    @Test
    public void createMultipleTeam_seq() throws NamingException, InterruptedException {
        final int size = gameModelFacade.findAll().size();

        GameModel myGameModel = new GameModel("TESTGM");
        gameModelFacade.create(myGameModel);

        Game g = new Game("TESTGAME", "xxx");
        gameFacade.create(myGameModel.getId(), g);
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

        gameModelFacade.remove(myGameModel.getId());
        Assert.assertEquals(size, gameModelFacade.findAll().size());
    }
}
