/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.sun.accessibility.internal.resources.accessibility;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.List;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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

        final Game g = new Game();
        g.setName("game");
        g.setGameModel(gameModel);
        gameFacade.create(g);
        final Team t = new Team();
        t.setGame(g);
        t.setName("team");
        teamFacade.create(t);
        final User u = new User();
        final AbstractAccount abstractAccount = new JpaAccount();
        abstractAccount.setEmail("a@a.com");
        u.addAccount(abstractAccount);
        userFacade.create(u);
        final Player p = new Player();
        p.setName("player");
        p.setUser(u);
        p.setTeam(t);
        playerFacade.create(p);

        final List<Game> registeredGames = gameFacade.findRegisteredGames(u.getId());
        org.junit.Assert.assertEquals("game", registeredGames.get(0).getName());

        gameFacade.remove(g.getId());
    }
}
