/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.rest.GameController;
import com.wegas.core.rest.TeamController;
import com.wegas.test.arquillian.AbstractArquillianTest;
import javax.inject.Inject;
import org.junit.Assert;
import static org.junit.Assert.*;
import org.junit.Test;
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

    @Inject
    private TeamController teamController;

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

            assertEquals(expected[i], result);
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

            assertTrue("Token " + g.getToken() + " not match " + expected[i], g.getToken().matches(expected[i] + "-.."));
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

        assertEquals(1, newGame.getTeams().size()); // Is debug team here ?
        assertEquals(1, newGame.getTeams().get(0).getPlayers().size()); // Is anybody within debug team ?
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

        assertEquals(1, newGame.getTeams().size()); // Is debug team here ?
        assertEquals(1, newGame.getTeams().get(0).getPlayers().size()); // Is anybody within debug team ?
    }

    @Test
    public void joiningClosedGameNotPossible() throws CloneNotSupportedException {
        WegasUser user = this.signup("user@test.local", "myPasswordIsSecure");
        WegasUser user2 = this.signup("user2@test.local", "myPasswordIsSecureToo");

        login(trainer);
        Game g = new Game("newGame");
        g.setAccess(Game.GameAccess.OPEN);
        g.setGameModel(gameModel);

        gameFacade.publishAndCreate(gameModel.getId(), g);
        g = gameFacade.find(g.getId());
        // there is one team: the test one
        Assert.assertEquals(1, g.getTeams().size());

        login(user);
        // Game is open, joining is fine
        Team team1 = new Team();
        team1.setName("test-team-1");
        teamController.create(g.getId(), team1);


        // close access
        login(admin);
        g = gameFacade.find(g.getId());
        // test team + team1
        Assert.assertEquals(2, g.getTeams().size());

        g.setAccess(Game.GameAccess.CLOSE);
        gameFacade.update(g.getId(), g);

        try {
            // Game is open, joining is fine
            login(user2);
            Team team2 = new Team();
            team2.setName("test-team-2");
            teamController.create(g.getId(), team2);
            Assert.fail("Game access is closed. Join should have failed");
        } catch (Exception ex) {
            // expected !
            System.out.println("Fails to join: game access is closed");
        }

        login(admin);
        // reaload game
        g = gameFacade.find(g.getId());
        // and assert there is one solely team (plus the test one)
        Assert.assertEquals(2, g.getTeams().size());
    }

    @Test
    public void creatingTeamNotPossible() throws CloneNotSupportedException {
        WegasUser user = this.signup("user@test.local", "myPasswordIsSecure");
        WegasUser user2 = this.signup("user2@test.local", "myPasswordIsSecureToo");


        login(trainer);
        Game g = new Game("newGame");
        g.setAccess(Game.GameAccess.OPEN);
        g.setGameModel(gameModel);

        gameFacade.publishAndCreate(gameModel.getId(), g);
        // reaload game
        g = gameFacade.find(g.getId());
        // and assert there is no teams but the test one
        Assert.assertEquals(1, g.getTeams().size());


        login(user);
        // Game is open and player may create teams, joining is fine
        Team team1 = new Team();
        team1.setName("test-team-1");
        teamController.create(g.getId(), team1);

        // reaload game
        login(trainer);
        g = gameFacade.find(g.getId());
        // and assert there is one solely team (plus the test one)
        Assert.assertEquals(2, g.getTeams().size());

        // prevent player to create teams
        g.setPreventPlayerCreatingTeams(true);
        gameFacade.update(g.getId(), g);

        try {
            // Game is open, joining is fine
            login(user2);
            Team team2 = new Team();
            team2.setName("test-team-2");
            teamController.create(g.getId(), team2);
            Assert.fail("Game access is closed. Join should have failed");
        } catch (Exception ex) {
            // expected !
            System.out.println("Fails to join: game access is closed");
        }

        // reaload game
        login(trainer);
        g = gameFacade.find(g.getId());
        // and assert there is still one solely team (+ the test one)
        Assert.assertEquals(2, g.getTeams().size());

        // Trainer is still able to create teams
        Team team2 = new Team();
        team2.setName("test-team-2");
        teamController.create(g.getId(), team2);

        g = gameFacade.find(g.getId());
        // and assert there is two teams (plus the test one)
        Assert.assertEquals(3, g.getTeams().size());
    }

    @Test
    public void leavingTeamNotPossible() throws CloneNotSupportedException {
        WegasUser user = this.signup("user@test.local", "myPasswordIsSecure");
        WegasUser user2 = this.signup("user2@test.local", "myPasswordIsSecureToo");


        login(trainer);
        Game g = new Game("newGame");
        g.setAccess(Game.GameAccess.OPEN);
        g.setGameModel(gameModel);

        gameFacade.publishAndCreate(gameModel.getId(), g);
        // reaload game
        g = gameFacade.find(g.getId());
        // and assert there is no teams but the test one
        Assert.assertEquals(1, g.getTeams().size());


        // Two players join the game (in one team)
        login(user);
        // Game is open and player may create teams, joining is fine
        Team team1 = new Team();
        team1.setName("test-team-1");
        Team created = (Team) teamController.create(g.getId(), team1).getEntity();

        Assert.assertEquals(0, created.getPlayers().size());

        Player player1 = gameFacade.joinTeam(created.getId(), null);

        created = teamFacade.find(created.getId());
        Assert.assertEquals(1, created.getPlayers().size());

        login(user2);
        Player player2 = gameFacade.joinTeam(created.getId(), null);
        created = teamFacade.find(created.getId());
        Assert.assertEquals(2, created.getPlayers().size());


        // 2nd player leaves
        playerFacade.remove(player2.getId());
        created = teamFacade.find(created.getId());
        Assert.assertEquals(1, created.getPlayers().size());

        // trainer toggle leave right
        login(trainer);

        // prevent player to leave teams
        g.setPreventPlayerLeavingTeam(true);
        gameFacade.update(g.getId(), g);

        // 1st cannot leave any-longer
        login(user);

        try {
            playerFacade.remove(player1.getId());
        } catch (Exception ex) {
            // expected !
            System.out.println("Fails to join: game access is closed");
        }

        created = teamFacade.find(created.getId());
        Assert.assertEquals(1, created.getPlayers().size());

        // 2nd user join again
        login(user2);
        player2 = gameFacade.joinTeam(created.getId(), null);
        created = teamFacade.find(created.getId());
        Assert.assertEquals(2, created.getPlayers().size());

        //Trainer kicks 2nd player
        login(trainer);
        playerFacade.remove(player2.getId());
        created = teamFacade.find(created.getId());
        Assert.assertEquals(1, created.getPlayers().size());
    }
}
