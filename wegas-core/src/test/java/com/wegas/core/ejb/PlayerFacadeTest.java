/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import javax.naming.NamingException;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class PlayerFacadeTest extends AbstractEJBTest {

    private static GameFacade gameFacade;

    @BeforeClass
    public static void init() throws NamingException {
        gameFacade = lookupBy(GameFacade.class);
    }

    /**
     * Test registeredGames
     */
    @Test
    public void testRemovePlayer() throws Exception {
        final TeamFacade teamFacade = lookupBy(TeamFacade.class);
        final PlayerFacade playerFacade = lookupBy(PlayerFacade.class);

        final Game g = new Game("game");
        g.setGameModel(gameModel);
        gameFacade.create(g);
        final Team t = new Team("team");
        t.setGame(g);
        teamFacade.create(t);
        final Player p1 = new Player("player");
        p1.setTeam(t);
        playerFacade.create(p1);
        final Player p2 = new Player("player1");
        p2.setTeam(t);
        playerFacade.create(p2);

        Game ng = gameFacade.find(g.getId());
        org.junit.Assert.assertEquals(2, ng.getTeams().get(1).getPlayers().size());

        playerFacade.remove(p1.getId());

        ng = gameFacade.find(g.getId());
        org.junit.Assert.assertEquals(1, ng.getTeams().get(1).getPlayers().size());

        gameFacade.remove(ng);                                                  // Clean up
    }
}
