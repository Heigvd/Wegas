/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import static com.wegas.core.ejb.GameModelFacadeTest.lookupBy;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class AbstractEJBTest {

    // *** Static *** //
    private static final Logger logger = LoggerFactory.getLogger(AbstractEJBTest.class);
    protected static EJBContainer ejbContainer;
    protected static GameModelFacade gameModelFacade;
    protected static VariableDescriptorFacade descriptorFacade;
    // *** Fields *** //
    protected static GameModel gameModel;
    protected static Game game;
    protected static Team team;
    protected static Player player;
    protected static Team team2;
    protected static Player player2;
    protected static Player player21;
    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @BeforeClass
    public static void setUp() throws NamingException {
        ejbContainer = TestHelper.getEJBContainer();
        gameModelFacade = lookupBy(GameModelFacade.class);
        descriptorFacade = lookupBy(VariableDescriptorFacade.class);
        lookupBy(UserFacade.class).guestLogin();
    }

    @AfterClass
    public static void tearDown() {

        ejbContainer.close();
        //logger.info("Closing the container");
    }

    @Before
    public void createGameModel() {
        gameModel = new GameModel();                                            // Create a game model
        gameModel.setName("test-gamemodel");

        game = new Game();                                                      // Create a game
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        gameModel.addGame(game);

        team = new Team();                                                      // a team and a player
        team.setName("test-team");
        game.addTeam(team);
        player = new Player("Player");
        team.addPlayer(player);

        team2 = new Team();                                                     // a team and a player
        team2.setName("test-team2");                                            // a second team and a player
        game.addTeam(team2);
        player2 = new Player("Player2");
        player21 = new Player("Player21");
        team2.addPlayer(player2);
        team2.addPlayer(player21);

        gameModelFacade.create(gameModel);                                      // Commit the game model
    }

    @After
    public void clear() throws NamingException {
        gameModelFacade.remove(gameModel.getId());
        RequestFacade rm = AbstractEJBTest.lookupBy(RequestFacade.class);
        rm.getRequestManager().setPlayer(null);
        rm.getRequestManager().clearUpdatedInstances();
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, service);
    }

    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, type);
    }
}
