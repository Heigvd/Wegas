/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.security.persistence.User;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class PlayerFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFacadeTest.class);

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
        Assertions.assertEquals(1, userFacade.getCurrentUser().getPlayers().size()); // user plays to game as player !
        Assertions.assertEquals(1, gameFacade.find(g.getId()).getTeams().size()); // debugTeam 

        Team t = new Team("team");
        t.setGame(g);
        teamFacade.create(t);

        Assertions.assertEquals(2, gameFacade.find(g.getId()).getTeams().size()); // debugTeam and team

        Player p1 = gameFacade.joinTeam(t.getId(), user.getId(), null);

        Assertions.assertEquals(1, gameFacade.find(g.getId()).getTeams().get(1).getPlayers().size()); // p1

        login(user21);
        Player p2 = gameFacade.joinTeam(t.getId(), user21.getId(), null);

        Game ng = gameFacade.find(g.getId());

        User currentUser = userFacade.find(user21.getId());
        Assertions.assertEquals(2, ng.getTeams().size());

        Team theTeam = null;
        for (Team tIt : ng.getTeams()) {
            if (!(tIt instanceof DebugTeam)) {
                theTeam = tIt;
                break;
            }
        }
        Assertions.assertNotNull(theTeam);
        Assertions.assertEquals(2, theTeam.getPlayers().size());

        Assertions.assertEquals(2, currentUser.getPlayers().size());

        login(user);
        playerFacade.remove(p1.getId());

        ng = gameFacade.find(g.getId());
        Assertions.assertEquals(2, ng.getTeams().size());
        theTeam = null;
        for (Team tIt : ng.getTeams()) {
            if (!(tIt instanceof DebugTeam)) {
                theTeam = tIt;
                break;
            }
        }
        Assertions.assertNotNull(theTeam);

        Assertions.assertEquals(1, theTeam.getPlayers().size());

        login(user21);
        playerFacade.remove(p2.getId()); //removing the last player in team leads to team deletion

        Assertions.assertEquals(1, gameFacade.find(g.getId()).getTeams().size()); // debugTeam

        Assertions.assertEquals(1, userFacade.getCurrentUser().getPlayers().size());

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

        Assertions.assertEquals(nbTeam + 1, g.getTeams().size()); // + 1 to count debug team
        for (Team t : g.getTeams()) {
            t = teamFacade.find(t.getId());
            if (t instanceof DebugTeam == false) {
                Assertions.assertEquals(nbPlayer, t.getPlayers().size());
            }
        }

        for (WegasUser wu : users) {
            login(wu);
            Player p = wu.getUser().getPlayers().get(0);
            Assertions.assertTrue(requestManager.hasPlayerRight(p));
            Assertions.assertTrue(requestManager.hasTeamRight(p.getTeam()));
            Assertions.assertTrue(requestManager.hasGameReadRight(p.getGame()));
            Assertions.assertTrue(requestManager.hasGameModelReadRight(p.getGameModel()));

            Assertions.assertFalse(requestManager.hasGameWriteRight(p.getGame()));
            Assertions.assertFalse(requestManager.hasGameModelWriteRight(p.getGameModel()));
        }

    }

}
