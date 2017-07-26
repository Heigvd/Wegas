/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptCheck;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.rest.GameController;
import com.wegas.core.rest.GameModelController;
import com.wegas.core.rest.PlayerController;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.rest.TeamController;
import com.wegas.core.rest.VariableDescriptorController;
import com.wegas.core.rest.VariableInstanceController;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.rest.UserController;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.messaging.ejb.MessageFacade;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.embeddable.EJBContainer;
import javax.mail.internet.AddressException;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.junit.Before;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AbstractEJBTestBase {

    // *** Static *** //
    protected static final Logger logger = LoggerFactory.getLogger(AbstractEJBTestBase.class);
    protected static EJBContainer ejbContainer = null;

    protected static PopulatorFacade populatorFacade;
    protected static PopulatorScheduler populatorScheduler;

    protected static GameModelController gameModelController;
    protected static GameController gameController;
    protected static TeamController teamController;
    protected static PlayerController playerController;

    protected static GameModelFacade gameModelFacade;
    protected static GameFacade gameFacade;
    protected static TeamFacade teamFacade;
    protected static PlayerFacade playerFacade;

    protected static RoleFacade roleFacade;

    protected static UserController userController;
    protected static UserFacade userFacade;
    protected static AccountFacade accountFacade;

    protected static VariableDescriptorFacade variableDescriptorFacade;
    protected static VariableInstanceFacade variableInstanceFacade;

    protected static VariableDescriptorController variableDescriptorController;
    protected static VariableInstanceController variableInstanceController;

    protected static ScriptFacade scriptFacade;
    protected static ScriptController scriptController;
    protected static ScriptCheck scriptCheck;
    protected static StateMachineFacade stateMachineFacade;

    protected static QuestionDescriptorFacade questionDescriptorFacade;
    protected static MessageFacade messageFacade;

    protected static ResourceFacade resourceFacade;

    protected static RequestFacade requestFacade;
    protected static RequestManager requestManager;

    protected static ObjectMapper jsonMapper;

    /**
     * Initial
     */
    protected static Role admins;
    protected static Role scenarists;
    protected static Role trainers;

    protected static WegasUser admin;

    public static void setUpFacades(String rootPath) throws NamingException {
        jsonMapper = JacksonMapperProvider.getMapper();

        if (ejbContainer == null) {
            ejbContainer = TestHelper.getEJBContainer(rootPath);

            populatorFacade = lookupBy(PopulatorFacade.class);
            populatorScheduler = populatorFacade.getPopulatorScheduler();

            gameModelController = lookupBy(GameModelController.class);
            gameController = lookupBy(GameController.class);
            teamController = lookupBy(TeamController.class);
            playerController = lookupBy(PlayerController.class);

            gameModelFacade = GameModelFacade.lookup();
            gameFacade = GameFacade.lookup();
            teamFacade = TeamFacade.lookup();
            playerFacade = PlayerFacade.lookup();

            roleFacade = lookupBy(RoleFacade.class);

            userController = lookupBy(UserController.class);
            userFacade = UserFacade.lookup();
            accountFacade = lookupBy(AccountFacade.class);

            variableDescriptorFacade = VariableDescriptorFacade.lookup();
            variableInstanceFacade = VariableInstanceFacade.lookup();

            variableDescriptorController = lookupBy(VariableDescriptorController.class);
            variableInstanceController = lookupBy(VariableInstanceController.class);

            scriptFacade = lookupBy(ScriptFacade.class);
            scriptController = lookupBy(ScriptController.class);
            scriptCheck = lookupBy(ScriptCheck.class);
            stateMachineFacade = lookupBy(StateMachineFacade.class);

            questionDescriptorFacade = QuestionDescriptorFacade.lookup();
            messageFacade = lookupBy(MessageFacade.class);
            resourceFacade = ResourceFacade.lookup();

            requestFacade = RequestFacade.lookup();
            requestManager = requestFacade.getRequestManager();
        }

    }

    @BeforeClass
    public static void setUpClass() throws NamingException {
        AbstractEJBTestBase.setUpFacades(".");
    }

    /**
     * Initial db content as defined by Liquibase Changelogs
     */
    @Before
    public void resetDb() throws NamingException, SQLException, WegasNoResultException {
        TestHelper.emptyDBTables();
        TestHelper.wipeEmCache();
        requestManager.setPlayer(null);

        requestManager.clearUpdatedEntities();
        requestManager.clearDestroyedEntities();
        requestManager.clearOutdatedEntities();

        //requestManager.clearPermissions();
        TestHelper.wipeEmCache();
        userFacade.logout();

        DataSource ds = (DataSource) new InitialContext().lookup("jdbc/wegas_dev");
        try (Connection connection = ds.getConnection("user", "1234");
                Statement statement = connection.createStatement()) {
            String setupQuery = "";
            setupQuery += "INSERT INTO roles (id, name, description) VALUES (1, 'Administrator', '');";
            setupQuery += "INSERT INTO roles (id, name, description) VALUES (2, 'Scenarist', '');";
            setupQuery += "INSERT INTO roles (id, name, description) VALUES (3, 'Trainer', '');";
            setupQuery += "INSERT INTO permission (id, permissions, role_id) VALUES (1, 'GameModel:*:*', 1);";
            setupQuery += "INSERT INTO permission (id, permissions, role_id) VALUES (2, 'Game:*:*', 1);";
            setupQuery += "INSERT INTO permission (id, permissions, role_id) VALUES (3, 'User:*:*', 1);";
            setupQuery += "INSERT INTO users (id) VALUES (1);";
            setupQuery += "INSERT INTO abstractaccount (id, username, email, dtype, user_id, passwordhex, salt) VALUES (1, 'root', 'root@local', 'JpaAccount', '1', 'eb86410aa029d4f7b85c1b4c3c0a25736f9ae4806bd75d456a333d83b648f2ee', '69066d73c2d03f85c5a8d3e39a2f184f');";
            setupQuery += "INSERT INTO users_roles (users_id, roles_id) VALUES (1, 1);";
            setupQuery += "UPDATE sequence SET seq_count=seq_count+50 WHERE seq_name = 'SEQ_GEN';";
            statement.execute(setupQuery);
        }

        admins = roleFacade.findByName("Administrator");
        scenarists = roleFacade.findByName("Scenarist");
        trainers = roleFacade.findByName("Trainer");
        admin = new WegasUser(userFacade.find(1l), "root", "1234");
        login(admin);
    }

    public static void logout() {
        userFacade.logout();
    }

    public static void login(WegasUser user) {
        Subject subject = SecurityUtils.getSubject();
        userFacade.logout();
        if (user.getUser().getMainAccount() instanceof GuestJpaAccount) {
            subject.login(new GuestToken(user.getUser().getMainAccount().getId()));
        } else {
            subject.login(new UsernamePasswordToken(user.getUsername(), user.getPassword()));
        }

        User currentUser = userFacade.getCurrentUser();
        if (!currentUser.equals(user.getUser())) {
            throw WegasErrorMessage.error("LOGIN FAILURE");
        }
    }

    public static User login(String username, String password) {
        Subject subject = SecurityUtils.getSubject();
        userFacade.logout();
        subject.login(new UsernamePasswordToken(username, password));
        return userFacade.getCurrentUser();
    }

    public static WegasUser signup(String email, String password) {
        logout();
        JpaAccount ja = new JpaAccount();
        ja.setEmail(email);
        ja.setPassword(password);
        try {
            User signup = userFacade.signup(ja);
            return new WegasUser(signup, email, password);
        } catch (AddressException ex) {
            throw WegasErrorMessage.error("Not a email address");
        }
    }

    public static WegasUser signup(String email) {
        return signup(email, Helper.genRandomLetters(10));
    }

    public static WegasUser guestLogin() {
        /*AuthenticationInformation authInfo = new AuthenticationInformation();
        authInfo.setRemember(true);*/
        return new WegasUser(userFacade.guestLogin(), null, null);
    }

    public static WegasUser addRoles(WegasUser user, Role... roles) {
        User u = userFacade.find(user.user.getId());
        for (Role role : roles) {
            userFacade.addRole(u.getId(), role.getId());
        }
        //userFacade.merge(user);
        user.user = userFacade.find(u.getId());
        return user;
    }

    @AfterClass
    public static void tearDown() {
        TestHelper.closeContainer();
    }

    private static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, type);
    }

    public static class WegasUser {

        User user;
        String username;
        String password;

        public WegasUser(User user, String username, String password) {
            this.user = user;
            this.username = username;
            this.password = password;
        }

        public Long getId() {
            return user.getId();
        }

        public String getPassword() {
            return password;
        }

        public User getUser() {
            return user;
        }

        public String getUsername() {
            return username;
        }

        public void setUser(User user) {
            this.user = user;
        }
    }
}
