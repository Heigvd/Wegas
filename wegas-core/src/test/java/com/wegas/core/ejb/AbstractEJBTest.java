/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.Collection;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class AbstractEJBTest extends AbstractEJBTestBase{

    // *** Static *** //
    private static final Logger logger = LoggerFactory.getLogger(AbstractEJBTest.class);

    protected static GameModel gameModel;
    protected static Game game;
    protected static Team team;
    protected static Player player;
    protected static Team team2;
    protected static Player player2;
    protected static Player player21;

    protected static User admin;
    protected static User scenarist;
    protected static User trainer;
    protected static User user;

    // *** Constants *** //
    final static private String GAMENAME = "test-game";
    final static private String GAMETOKEN = "test-game-token";

    @BeforeClass
    public static void setUp() throws NamingException {
        RequestManager rm = RequestFacade.lookup().getRequestManager();

        Role admins = new Role("Administrator");
        roleFacade.create(admins);

        admin = userFacade.guestLogin();

        admin = addRoles(admin, admins);

        //Role guests = new Role("Guest");
        Role registered = new Role("Registered");
        Role scenarists = new Role("Scenarist");
        Role trainers = new Role("Trainer");
        Role publicRole = new Role("Public");

        roleFacade.create(scenarists);
        roleFacade.create(trainers);
        //roleFacade.create(registered);
        //roleFacade.create(publicRole);
        //roleFacade.create(guests);

        //rm.getEntityManager().getEntityManagerFactory().getCache().evictAll();
        securityFacade.clearPermissions();

        scenarist = AbstractEJBTest.createUser();
        trainer = AbstractEJBTest.createUser();
        user = AbstractEJBTest.createUser();

        scenarist = addRoles(scenarist, scenarists);
        trainer = addRoles(trainer, trainers);

        /*
        scenarist = addRoles(scenarist, scenarists, registered, publicRole);
        trainer = addRoles(trainer, trainers, registered, publicRole);
        user = addRoles(user, registered, publicRole);
         */
        userFacade.logout();
    }

    public static User createUser(AbstractAccount aa) {
        User newUser = new User();
        userFacade.create(newUser);

        newUser.addAccount(aa);
        userFacade.merge(newUser);
        return userFacade.find(newUser.getId());
    }

    public static User createUser() {
        return AbstractEJBTest.createUser(new GuestJpaAccount());
    }

    public static User addRoles(User user, Role... roles) {
        user = userFacade.find(user.getId());
        Collection<Role> userRoles = user.getRoles();
        for (Role role : roles) {
            userRoles.add(role);
        }
        userFacade.merge(user);
        return userFacade.find(user.getId());
    }

    /**
     * Create a GameModel and a game with two teams (test-team and test-team2),
     * with, respectively, one and two players ("Player", "Player2", and
     * "Player21").
     *
     */
    @Before
    public void createGameModel() {
        login(admin);

        login(scenarist);
        gameModel = new GameModel();
        gameModel.setName("test-gamemodel");
        gameModelFacade.create(gameModel);
        gameModel = gameModelFacade.find(gameModel.getId());

        userFacade.addAccountPermission(trainer.getMainAccount().getId(), "GameModel:Instantiate:gm" + gameModel.getId());

        login(scenarist);
        game = new Game();
        game.setName(GAMENAME);
        game.setToken(GAMETOKEN);
        game.setAccess(Game.GameAccess.OPEN);
        gameFacade.create(gameModel.getId(), game);

        login(user);
        team = new Team();
        team.setName("test-team");
        teamFacade.create(game.getId(), team);

        player = gameFacade.joinTeam(team.getId(), user.getId());

        team2 = new Team();
        team2.setName("test-team2");

        teamFacade.create(game.getId(), team2);

        login(admin);
        User user2 = AbstractEJBTest.createUser();
        login(user2);
        player2 = gameFacade.joinTeam(team2.getId(), user2.getId());

        logout();
        User user21 = AbstractEJBTest.createUser();
        login(user21);
        player21 = gameFacade.joinTeam(team2.getId(), user21.getId());

        login(admin);
    }

    @After
    public void clear() throws NamingException {
        login(admin);
        TestHelper.wipeEmCache();
        RequestFacade rm = AbstractEJBTest.lookupBy(RequestFacade.class);
        rm.getRequestManager().setPlayer(null);
        rm.getRequestManager().clearUpdatedEntities();
        gameModelFacade.remove(gameModel.getId());
        TestHelper.wipeEmCache();

        securityFacade.clearPermissions();

        userFacade.logout();
    }
}
