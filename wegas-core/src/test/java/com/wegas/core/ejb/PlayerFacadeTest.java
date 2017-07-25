/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.test.AbstractEJBTest;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.persistence.User;
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
public class PlayerFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFacadeTest.class);

    /**
     * Test registeredGames
     */
    @Test
    public void testRemovePlayer() throws Exception {
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

        Player p1 = gameFacade.joinTeam(t.getId(), user.getId());

        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().get(1).getPlayers().size()); // p1

        login(user2);
        Player p2 = gameFacade.joinTeam(t.getId(), user2.getId());

        Game ng = gameFacade.find(g.getId());

        User currentUser = userFacade.find(user2.getId());
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

        login(user2);
        playerFacade.remove(p2.getId()); //removing the last player in team leads to team deletion

        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().size()); // debugTeam

        Assert.assertEquals(1, userFacade.getCurrentUser().getPlayers().size());

        login(admin);
        gameFacade.remove(g.getId());                                           // Clean up
    }

    //@Test
    public void getInstances() {
        logger.error("Da TEST");
        TextDescriptor gmScoped = new TextDescriptor();
        gmScoped.setName("gmScoped");
        gmScoped.setScope(new GameModelScope());
        gmScoped.setDefaultInstance(new TextInstance());

        TextDescriptor gScoped = new TextDescriptor();
        gScoped.setName("gScoped");
        gScoped.setScope(new GameScope());
        gScoped.setDefaultInstance(new TextInstance());

        TextDescriptor tScoped = new TextDescriptor();
        tScoped.setName("tScoped");
        tScoped.setScope(new TeamScope());
        tScoped.setDefaultInstance(new TextInstance());

        TextDescriptor pScoped = new TextDescriptor();
        pScoped.setName("pScoped");
        pScoped.setScope(new PlayerScope());
        pScoped.setDefaultInstance(new TextInstance());

        logger.error("CREATE NEW DESCRIPTORS");

        variableDescriptorFacade.create(gameModel.getId(), gmScoped);
        variableDescriptorFacade.create(gameModel.getId(), gScoped);
        variableDescriptorFacade.create(gameModel.getId(), tScoped);
        variableDescriptorFacade.create(gameModel.getId(), pScoped);

        List<VariableInstance> instances = playerFacade.getInstances(player.getId());

        /* One global instance */
        Assert.assertEquals(1, gameModelFacade.find(gameModel.getId()).getPrivateInstances().size());

        /* One quite-global instance */
        Assert.assertEquals(1, gameFacade.find(game.getId()).getPrivateInstances().size());

        /* each team own one instance */
        Assert.assertEquals(1, teamFacade.find(team.getId()).getPrivateInstances().size());
        Assert.assertEquals(1, teamFacade.find(team2.getId()).getPrivateInstances().size());

        /* each player owns one instance */
        Assert.assertEquals(1, playerFacade.find(player.getId()).getPrivateInstances().size());
        Assert.assertEquals(1, playerFacade.find(player2.getId()).getPrivateInstances().size());
        Assert.assertEquals(1, playerFacade.find(player21.getId()).getPrivateInstances().size());

        Assert.assertEquals(4, instances.size());
    }

    private Team createTeam(Game g, String name) {
        Team t = new Team(name);
        t.setGame(g);
        teamFacade.create(g.getId(), t);
        return t;
    }

    private WegasUser createPlayer(Team t, int i, int j) {
        WegasUser u = PlayerFacadeTest.signup("massive_player_" + i + "_" + j + "@local");

        gameFacade.joinTeam(t.getId(), u.getId());
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

}
