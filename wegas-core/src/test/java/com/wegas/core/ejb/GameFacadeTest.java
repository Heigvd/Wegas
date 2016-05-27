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
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.rest.GameController;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
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
    private static GameController gameController;

    @BeforeClass
    public static void init() throws NamingException {
        gameFacade = lookupBy(GameFacade.class);
        gameController = lookupBy(GameController.class);
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

    @Test
    public void testGameCreation() throws IOException {
        VariableDescriptorFacade vdf = VariableDescriptorFacade.lookup();
        Game newGame = new Game("newGame");
        newGame.setAccess(Game.GameAccess.OPEN);
        newGame.setGameModelId(gameModel.getId());

        BooleanDescriptor desc = new BooleanDescriptor("Bln");
        desc.setDefaultInstance(new BooleanInstance(true));

        vdf.create(gameModel.getId(), desc);

        gameFacade.publishAndCreate(gameModel.getId(), newGame);

        newGame = gameFacade.find(newGame.getId());

        assertEquals(1, newGame.getTeams().size()); // Is debug team here ?
        assertEquals(1, newGame.getTeams().get(0).getPlayers().size()); // Is anybody within debug team ?
    }

    @Test
    public void testGameCreationThroughController() throws IOException {
        Game newGame = new Game("newGame");
        newGame.setAccess(Game.GameAccess.OPEN);
        newGame.setGameModelId(gameModel.getId());

        gameController.create(gameModel.getId(), newGame);
    }
}
