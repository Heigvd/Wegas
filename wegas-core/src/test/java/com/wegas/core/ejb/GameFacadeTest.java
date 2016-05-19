/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.User;
import java.util.List;
import javax.naming.NamingException;
import static org.junit.Assert.*;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class GameFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(GameFacadeTest.class);
    private static GameFacade gameFacade;

    @BeforeClass
    public static void init() throws NamingException {
        gameFacade = lookupBy(GameFacade.class);
    }

    /**
     * Test registeredGames
     */
    @Test
    public void testFindRegisteredGames() throws Exception {
        final TeamFacade teamFacade = lookupBy(TeamFacade.class);
        final PlayerFacade playerFacade = lookupBy(PlayerFacade.class);
        final UserFacade userFacade = lookupBy(UserFacade.class);

        final Game g = new Game("game");
        g.setGameModel(gameModel);
        gameFacade.create(g);
        final Team t = new Team("team");
        t.setGame(g);
        teamFacade.create(t);
        final User u = new User();
        final JpaAccount abstractAccount = new JpaAccount();
        abstractAccount.setEmail("a@a.local");
        u.addAccount(abstractAccount);
        userFacade.create(u);
        final Player p = new Player("player");
        p.setUser(u);
        p.setTeam(t);
        playerFacade.create(p);

        final List<Game> registeredGames = gameFacade.findRegisteredGames(u.getId());
        assertEquals("game", registeredGames.get(0).getName());

        gameFacade.remove(g.getId());
    }
}
