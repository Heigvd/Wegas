/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
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
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.rest.UserController;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.messaging.ejb.MessageFacade;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Collection;
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
import org.apache.shiro.subject.Subject;
import org.junit.Before;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AbstractEJBTestBase {

    // *** Static *** //
    private static final Logger logger = LoggerFactory.getLogger(AbstractEJBTestBase.class);
    private static EJBContainer ejbContainer = null;

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

    protected static RequestFacade requestFacade;
    protected static RequestManager requestManager;

    protected static ObjectMapper jsonMapper;

    /**
     * Initial
     */
    protected static Role admins;
    protected static Role scenarists;
    protected static Role trainers;

    protected static User admin;

    @BeforeClass
    public static void setUpFacades() throws NamingException {
        jsonMapper = JacksonMapperProvider.getMapper();

        if (ejbContainer == null) {
            ejbContainer = TestHelper.getEJBContainer();

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

            requestFacade = RequestFacade.lookup();
            requestManager = requestFacade.getRequestManager();
        }

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
            setupQuery += "INSERT INTO abstractaccount (id, email, dtype, user_id, passwordhex, salt) VALUES (1, 'root@local', 'JpaAccount', '1', 'eb86410aa029d4f7b85c1b4c3c0a25736f9ae4806bd75d456a333d83b648f2ee', '69066d73c2d03f85c5a8d3e39a2f184f');";
            setupQuery += "INSERT INTO users_roles (users_id, roles_id) VALUES (1, 1);";
            setupQuery += "UPDATE sequence SET seq_count=seq_count+50 WHERE seq_name = 'SEQ_GEN';";
            statement.execute(setupQuery);
        }

        admins = roleFacade.findByName("Administrator");
        scenarists = roleFacade.findByName("Scenarist");
        trainers = roleFacade.findByName("Trainer");
        admin = userFacade.find(1l);
        login(admin);
    }

    public static void logout() {
        userFacade.logout();
    }

    public static void login(User user) {
        Subject subject = SecurityUtils.getSubject();
        userFacade.logout();
        subject.login(new GuestToken(user.getMainAccount().getId()));
        User currentUser = userFacade.getCurrentUser();
        if (!currentUser.equals(user)) {
            throw WegasErrorMessage.error("LOGIN FAILURE");
        }
    }

    public static User signup(String email) {
        JpaAccount ja = new JpaAccount();
        ja.setEmail(email);
        try {
            return userFacade.signup(ja);
        } catch (AddressException ex) {
            throw WegasErrorMessage.error("Not a email address");
        }
    }

    public static User guestLogin() {
        /*AuthenticationInformation authInfo = new AuthenticationInformation();
        authInfo.setRemember(true);*/
        return userFacade.guestLogin();
    }

    public static User addRoles(User user, Role... roles) {
        user = userFacade.find(user.getId());
        for (Role role : roles) {
            userFacade.addRole(user.getId(), role.getId());
        }
        //userFacade.merge(user);
        return userFacade.find(user.getId());
    }

    @AfterClass
    public static void tearDown() {
        TestHelper.closeContainer();
    }

    private static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, type);
    }
}
