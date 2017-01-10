/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AbstractEJBTest {

    // *** Static *** //
    private static final Logger logger = LoggerFactory.getLogger(AbstractEJBTest.class);
    private static EJBContainer ejbContainer;
    protected static GameModelFacade gameModelFacade;
    protected static GameFacade gameFacade;
    protected static TeamFacade teamFacade;
    protected static RoleFacade roleFacade;
    protected static UserFacade userFacade;
    protected static VariableDescriptorFacade descriptorFacade;
    // *** Fields *** //
    protected static GameModel gameModel;
    protected static Game game;
    protected static Team team;
    protected static Player player;
    protected static Team team2;
    protected static Player player2;
    protected static Player player21;
    protected static User guest;
    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @BeforeClass
    public static void setUp() throws NamingException {
        ejbContainer = TestHelper.getEJBContainer();
        gameModelFacade = lookupBy(GameModelFacade.class);
        gameFacade = GameFacade.lookup();
        teamFacade = TeamFacade.lookup();
        descriptorFacade = lookupBy(VariableDescriptorFacade.class);
        roleFacade = lookupBy(RoleFacade.class);
        userFacade = UserFacade.lookup();

        guest = userFacade.guestLogin();
        RequestFacade.lookup().getRequestManager().setCurrentUser(guest);
    }

    @AfterClass
    public static void tearDown() {
        TestHelper.closeContainer();
    }

    /**
     * Create a GameModel and a game with two teams (test-team and test-team2),
     * with, respectively, one and two players ("Player", "Player2", and
     * "Player21").
     *
     */
    @Before
    public void createGameModel() {
        gameModel = new GameModel();                                            // Create a game model
        gameModel.setName("test-gamemodel");
        gameModelFacade.create(gameModel);                                      // Commit the game model

        game = new Game();                                                      // Create a game
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        game.setAccess(Game.GameAccess.OPEN);
        gameFacade.create(gameModel.getId(), game);

        team = new Team();                                                      // a team and a player
        team.setName("test-team");
        teamFacade.create(game.getId(), team);

        player = gameFacade.joinTeam(team.getId(), guest.getId());

        team2 = new Team();                                                     // a team and a player
        team2.setName("test-team2");                                            // a second team and a player

        teamFacade.create(game.getId(), team2);

        User user2 = new User();
        userFacade.create(user2);
        player2 = gameFacade.joinTeam(team2.getId(), user2.getId());

        User user21 = new User();
        userFacade.create(user21);
        player21 = gameFacade.joinTeam(team2.getId(), user21.getId());
    }

    @After
    public void clear() throws NamingException {
        TestHelper.wipeEmCache();
        RequestFacade rm = AbstractEJBTest.lookupBy(RequestFacade.class);
        rm.getRequestManager().setPlayer(null);
        rm.getRequestManager().clearUpdatedEntities();
        gameModelFacade.remove(gameModel.getId());
        TestHelper.wipeEmCache();
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, service);
    }

    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, type);
    }
}
