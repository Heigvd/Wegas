/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

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
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.User;
import java.util.List;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class PlayerFacadeTest extends AbstractEJBTest {

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
        Assert.assertEquals(2, gameFacade.find(g.getId()).getTeams().get(1).getPlayers().size()); // p1 and p2
        Assert.assertEquals(2, userFacade.getCurrentUser().getPlayers().size()); //user plays to game as player2 and to g as p2

        login(user);
        playerFacade.remove(p1.getId());

        Assert.assertEquals(2, gameFacade.find(g.getId()).getTeams().size()); // debugTeam and team
        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().get(1).getPlayers().size()); // p2 only

        login(user2);
        playerFacade.remove(p2.getId()); //removing the last player in team leads to team deletion

        Assert.assertEquals(1, gameFacade.find(g.getId()).getTeams().size()); // debugTeam

        Assert.assertEquals(1, userFacade.getCurrentUser().getPlayers().size());

        login(admin);
        gameFacade.remove(g.getId());                                           // Clean up
    }

    //@Test
    public void getInstances() {
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

        variableDescriptorFacade.create(gameModel.getId(), gmScoped);
        variableDescriptorFacade.create(gameModel.getId(), gScoped);
        variableDescriptorFacade.create(gameModel.getId(), tScoped);
        variableDescriptorFacade.create(gameModel.getId(), pScoped);

        List<VariableInstance> instances = playerFacade.getInstances(player.getId());

        Assert.assertEquals(1, gameModelFacade.find(gameModel.getId()).getPrivateInstances().size());
        Assert.assertEquals(1, gameFacade.find(game.getId()).getPrivateInstances().size());
        Assert.assertEquals(1, teamFacade.find(team.getId()).getPrivateInstances().size());
        Assert.assertEquals(1, playerFacade.find(player.getId()).getPrivateInstances().size());

        Assert.assertEquals(4, instances.size());
    }

    private Team createTeam(Game g, String name) {
        Team t = new Team(name);
        t.setGame(g);
        teamFacade.create(g.getId(), t);
        return t;
    }

    private Player createPlayer(Team t, int i, int j) {
        User u = PlayerFacadeTest.signup("massive_player_" + i + "_" + j + "@local");

        return gameFacade.joinTeam(t.getId(), u.getId());
    }

    /**
     * Test registeredGames
     */
    @Test
    public void testMassiveJoin() throws Exception {
        int nbTeam = 100;
        int nbPlayer = 10;

        login(trainer);
        Game g = new Game("game");
        g.setGameModel(gameModel);
        gameFacade.publishAndCreate(gameModel.getId(), g);

        for (int i = 0; i < nbTeam; i++) {
            Team t = createTeam(g, "T" + i);
            for (int j = 0; j < nbPlayer; j++) {
                createPlayer(t, i, j);
            }
        }

        g = gameFacade.find(g.getId());

        Assert.assertEquals(nbTeam + 1, g.getTeams().size()); // + 1 to count debug team
        for (Team t : g.getTeams()) {
            t = teamFacade.find(t.getId());
            if (t instanceof DebugTeam == false) {
                Assert.assertEquals(nbPlayer, t.getPlayers().size());
                for (Player p : t.getPlayers()) {
                    Assert.assertEquals(1, p.getUser().getPermissions().size());
                    Permission perm = p.getUser().getPermissions().get(0);
                    Assert.assertEquals("Game:View:g" + g.getId(), perm.getValue());
                    Assert.assertEquals("GameModel:View:gm" + g.getGameModel().getId(), perm.getInducedPermission());
                }
            }
        }

    }

}
