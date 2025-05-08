/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.rest.PlayerController;
import com.wegas.core.rest.TeamController;
import com.wegas.core.security.persistence.User;
import com.wegas.test.arquillian.AbstractArquillianTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class PlayerFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFacadeTest.class);

    @Inject
    private PlayerController playerController;

    @Inject
    private TeamController teamController;

    /**
     * Test registeredGames
     */
    @Test
    public void testRemovePlayer() throws Exception {
        this.createSecondTeam();
        /**
         * Create a game as trainer
         */
        login(trainer);
        final Game g = new Game("game");
        g.setAccess(Game.GameAccess.OPEN);
        g.setGameModel(gameModel);
        gameFacade.publishAndCreate(gameModel.getId(), g);

        /**
         * Login as user
         */
        login(user);
        Assert.assertEquals(1, userFacade.getCurrentUser().getPlayers().size()); // user plays to game as player !
        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().size()); // debugTeam

        Team t = new Team("team");
        t.setGame(g);
        teamFacade.create(t);

        Assert.assertEquals(2, gameFacade.find(g.getId()).getTeams().size()); // debugTeam and team

        Player p1 = gameFacade.joinTeam(t.getId(), user.getId(), null);

        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().get(1).getPlayers().size()); // p1

        login(user21);
        Player p2 = gameFacade.joinTeam(t.getId(), user21.getId(), null);

        Game ng = gameFacade.find(g.getId());

        User currentUser = userFacade.find(user21.getId());
        Assert.assertEquals(2, ng.getTeams().size());

        Team theTeam = null;
        for (Team tIt : ng.getTeams()) {
            if (!(tIt instanceof DebugTeam)) {
                theTeam = tIt;
                break;
            }
        }
        Assert.assertNotNull(theTeam);
        Assert.assertEquals(2, theTeam.getPlayers().size());

        Assert.assertEquals(2, currentUser.getPlayers().size());

        login(user);
        playerFacade.remove(p1.getId());

        ng = gameFacade.find(g.getId());
        Assert.assertEquals(2, ng.getTeams().size());
        theTeam = null;
        for (Team tIt : ng.getTeams()) {
            if (!(tIt instanceof DebugTeam)) {
                theTeam = tIt;
                break;
            }
        }
        Assert.assertNotNull(theTeam);

        Assert.assertEquals(1, theTeam.getPlayers().size());

        login(user21);
        playerFacade.remove(p2.getId()); //removing the last player in team leads to team deletion

        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().size()); // debugTeam

        Assert.assertEquals(1, userFacade.getCurrentUser().getPlayers().size());

        login(admin);
        gameFacade.remove(g.getId());                                           // Clean up
    }

    private Team createTeam(Game g, String name) {
        Team t = new Team(name);
        t.setGame(g);
        teamFacade.create(g.getId(), t);
        return t;
    }

    private WegasUser createPlayer(Team t, int i, int j) {
        WegasUser u = this.signup("massive_player_" + i + "_" + j + "@local");
        login(u);
        gameFacade.joinTeam(t.getId(), null);
        u.setUser(userFacade.find(u.getId()));

        return u;
    }

    /**
     * Test registeredGames
     */
    @Test
    public void testMassiveJoin() throws Exception {
        int nbTeam = 50;
        int nbPlayer = 10;

        TextDescriptor pScoped = new TextDescriptor();
        pScoped.setName("pScoped");
        pScoped.setScope(new PlayerScope());
        pScoped.setDefaultInstance(new TextInstance());

        variableDescriptorFacade.create(gameModel.getId(), pScoped);



        login(trainer);
        Game g = new Game("game");
        g.setAccess(Game.GameAccess.OPEN);
        g.setGameModel(gameModel);
        gameFacade.publishAndCreate(gameModel.getId(), g);
        List<WegasUser> users = new ArrayList<>();

        //populatorScheduler.setAsync(true);
        for (int i = 0; i < nbTeam; i++) {
            Team t = createTeam(g, "T" + i);
            for (int j = 0; j < nbPlayer; j++) {
                users.add(createPlayer(t, i, j));
            }
        }

        g = gameFacade.find(g.getId());

        Assert.assertEquals(nbTeam + 1, g.getTeams().size()); // + 1 to count debug team
        for (Team t : g.getTeams()) {
            t = teamFacade.find(t.getId());
            if (t instanceof DebugTeam == false) {
                Assert.assertEquals(nbPlayer, t.getPlayers().size());
            }
        }

        for (WegasUser wu : users) {
            login(wu);
            Player p = wu.getUser().getPlayers().get(0);
            Assert.assertTrue(requestManager.hasPlayerRight(p));
            Assert.assertTrue(requestManager.hasTeamRight(p.getTeam()));
            Assert.assertTrue(requestManager.hasGameReadRight(p.getGame()));
            Assert.assertTrue(requestManager.hasGameModelReadRight(p.getGameModel()));

            Assert.assertFalse(requestManager.hasGameWriteRight(p.getGame()));
            Assert.assertFalse(requestManager.hasGameModelWriteRight(p.getGameModel()));
        }

    }

    @Test
    public void testControllerMethod() throws Exception {
        login(user21);
        Response create = playerController.create(null, this.team.getId());
        Team team = (Team) create.getEntity();
        Assert.assertEquals(2, team.getPlayers().size());
    }

    @Test
    public void playerStatusTest() {
        GameModel myGameModel = new GameModel("TESTGM");
        gameModelFacade.create(myGameModel);

        Game g = new Game("TESTGAME", "xxx");
        gameFacade.create(myGameModel.getId(), g);
        Team t1 = new Team();
        t1.setName("test-team");

        Team team1 = teamFacade.create(g.getId(), t1);
        Assert.assertEquals(Status.LIVE, team1.getStatus());

        Player player1 = gameFacade.joinTeam(team1.getId(), null);
        Assert.assertEquals(Status.LIVE, player1.getStatus());
    }

    @Test
    public void playerStatusTestThroughController() {
        GameModel myGameModel = new GameModel("TESTGM");
        gameModelFacade.create(myGameModel);

        Game g = new Game("TESTGAME", "xxx");
        gameFacade.create(myGameModel.getId(), g);
        Team t1 = new Team();
        t1.setName("test-team");

        Team team1 = teamController.create(g.getId(), t1);
        Assert.assertEquals(Status.LIVE, team1.getStatus());

        Response create = playerController.create(null, team1.getId());
        team1 = (Team) create.getEntity();
        Player player1 = team1.getPlayers().get(0);
        Assert.assertEquals(Status.LIVE, player1.getStatus());
    }

}
