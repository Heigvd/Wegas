
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.rest.GameController;
import com.wegas.test.arquillian.AbstractArquillianTest;
import javax.inject.Inject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class GameFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(GameFacadeTest.class);

    @Inject
    private GameController gameController;

    @Test
    public void testNames() throws Exception {
        String[] names = {"MyGame", ""};
        String[] expected = {"MyGame", null};
        int i;

        for (i = 0; i < names.length; i++) {
            final Game g = new Game(names[i]);
            g.setGameModel(scenario);
            String result;

            try {
                gameFacade.create(g);
                result = g.getName();
                gameFacade.remove(g.getId());
            } catch (Exception ex) {
                result = null;
            }

            Assertions.assertEquals(expected[i], result);
        }
    }

    @Test
    public void testTokenGen() throws Exception {
        String[] names = {"MyGame", "../", "éàè", "hello, world", "hello!"};
        String[] expected = {"mygame", "___", "eae", "hello__worl", "hello_"};
        int i;

        for (i = 0; i < names.length; i++) {
            final Game g = new Game(names[i]);
            g.setGameModel(scenario);
            gameFacade.create(g);

            Assertions.assertTrue(g.getToken().matches(expected[i] + "-.."), "Token " + g.getToken() + " not match " + expected[i]);
            gameFacade.remove(g.getId());
        }
    }

    @Test
    public void testGameCreation() throws CloneNotSupportedException {
        //Update the gameModel
        login(scenarist);
        Game newGame = new Game("newGame");
        newGame.setAccess(Game.GameAccess.OPEN);
        newGame.setGameModel(gameModel);

        BooleanDescriptor desc = new BooleanDescriptor("Bln");
        desc.setDefaultInstance(new BooleanInstance(true));

        variableDescriptorFacade.create(gameModel.getId(), desc);

        login(trainer);
        gameFacade.publishAndCreate(gameModel.getId(), newGame);

        newGame = gameFacade.find(newGame.getId());

        Assertions.assertEquals(1, newGame.getTeams().size()); // Is debug team here ?
        Assertions.assertEquals(1, newGame.getTeams().get(0).getPlayers().size()); // Is anybody within debug team ?
    }

    @Test
    public void testGameCreationThroughController() throws CloneNotSupportedException {
        Game newGame = new Game("newGame");
        newGame.setAccess(Game.GameAccess.OPEN);
        newGame.setGameModel(gameModel);
        //newGame.setGameModelId(scenario.getId());

        login(trainer);
        gameController.create(gameModel.getId(), newGame);
        newGame = gameFacade.find(newGame.getId());

        Assertions.assertEquals(1, newGame.getTeams().size()); // Is debug team here ?
        Assertions.assertEquals(1, newGame.getTeams().get(0).getPlayers().size()); // Is anybody within debug team ?
    }
}
