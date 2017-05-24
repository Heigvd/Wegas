/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.utils.AbstractTest;
import java.io.File;
import org.slf4j.LoggerFactory;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.mail.internet.AddressException;
import javax.naming.InitialContext;
import javax.sql.DataSource;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.subject.Subject;
import org.glassfish.embeddable.GlassFishException;
import org.junit.AfterClass;
import org.junit.BeforeClass;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public abstract class AbstractEJBContainerTest extends AbstractTest {

    private static EJBContainer container;

    private static GameModelFacade gmFacade;

    private static RoleFacade roleFacade;
    private static UserFacade userFacade;

    private static org.slf4j.Logger logger = LoggerFactory.getLogger(AbstractEJBContainerTest.class);

    protected static Role admins;
    protected static Role scenarists;
    protected static Role trainers;

    protected static User admin;

    /**
     * Initial db content as defined by Liquibase Changelogs
     */
    public static void resetDb() throws NamingException, SQLException, WegasNoResultException {
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
        Collection<Role> userRoles = user.getRoles();
        for (Role role : roles) {
            userFacade.addRole(user.getId(), role.getId());
            userRoles.add(role);
        }
        userFacade.merge(user);
        return userFacade.find(user.getId());
    }

    @BeforeClass
    public static void setUp() throws Exception {
        if (container == null) {

            String clusterNameKey = "wegas.hazelcast.clustername";
            String clusterName = "hz_wegas_test_cluster_" + Helper.genToken(5);

            System.setProperty(clusterNameKey, clusterName);

            Map<String, Object> properties = new HashMap<>();                       // Init Ejb container
            properties.put(EJBContainer.MODULES, new File[]{new File("../wegas-core/target/embed-classes")});
            properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "../wegas-core/src/test/glassfish");
            //properties.put(EJBContainer.APP_NAME,"class");
            //ejbContainer.getContext().rebind("inject", this);

            // Init shiro
            SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());

            /* Log Levels */
            Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.SEVERE);
            Logger.getLogger("javax.enterprise.system").setLevel(Level.SEVERE);
            org.glassfish.ejb.LogFacade.getLogger().setLevel(Level.SEVERE);

            container = EJBContainer.createEJBContainer(properties);
            //Helper.lookupBy(container.getContext(), UserFacade.class, UserFacade.class).guestLogin(); //login as guest

            gmFacade = GameModelFacade.lookup();
            roleFacade = RoleFacade.lookup();
            userFacade = UserFacade.lookup();

            resetDb();
        }
    }

    @AfterClass
    public static void tearDown() throws GlassFishException, NamingException {
//        if (container != null) {
//            logger.error("CLOSE CONTAINER");
//            container.getContext().close();
//            container.close();
//            container = null;
//        }
    }

    protected <T> T lookup(Class<T> className) {
        try {
            return Helper.lookupBy(container.getContext(), className, className);
        } catch (NamingException ex) {
            return null;
        }
    }

    @Override
    protected ScriptController getScriptController() {
        return lookup(ScriptController.class);
    }

    @Override
    protected VariableDescriptorFacade getVariableDescriptorFacade() {
        return lookup(VariableDescriptorFacade.class);
    }

    @Override
    protected GameModelFacade getGameModelFacade() {
        return gmFacade;
    }
}
