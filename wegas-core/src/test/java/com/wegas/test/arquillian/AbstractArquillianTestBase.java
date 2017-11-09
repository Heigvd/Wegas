/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test.arquillian;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.HelperBean;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.SessionManager;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.test.TestHelper;
import java.io.File;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Level;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.mail.internet.AddressException;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.subject.Subject;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.importer.ExplodedImporter;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@RunWith(Arquillian.class)
public abstract class AbstractArquillianTestBase {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractArquillianTestBase.class);

    @EJB
    protected GameModelFacade gameModelFacade;

    @EJB
    protected GameFacade gameFacade;

    @EJB
    protected TeamFacade teamFacade;

    @EJB
    protected RoleFacade roleFacade;

    @EJB
    protected UserFacade userFacade;

    @EJB
    protected AccountFacade accountFacade;

    @EJB
    protected PlayerFacade playerFacade;

    @EJB
    protected VariableDescriptorFacade variableDescriptorFacade;

    @EJB
    protected VariableInstanceFacade variableInstanceFacade;

    @EJB
    protected ScriptFacade scriptFacade;

    @Inject
    protected HelperBean helperBean;

    @EJB
    protected RequestFacade requestFacade;

    @Inject
    protected RequestManager requestManager;

    @Inject
    private PopulatorScheduler populatorScheduler;

    protected User guest;

    @Rule
    public TestName name = new TestName();

    protected long initTime;

    private long startTime;

    static {
        String clusterNameKey = "wegas.hazelcast.clustername";
        String clusterName = "hz_wegas_test_cluster_" + Helper.genToken(5);
        System.setProperty(clusterNameKey, clusterName);
    }

    protected Role admins;
    protected Role scenarists;
    protected Role trainers;

    protected WegasUser admin;

    @Deployment
    public static JavaArchive createDeployement() {
        JavaArchive war = ShrinkWrap.create(JavaArchive.class).
                as(ExplodedImporter.class).importDirectory(new File("../wegas-core/target/embed-classes/")).
                as(JavaArchive.class);

        //war.addPackages(true, "com.wegas");
        //war.addAsDirectory("target/embed-classes/");
        //war.addAsResource("./src/test/resources/META-INF/persistence.xml", "META-INF/persistence.xml");
        //logger.error("MyWegasArchive: {}", war.toString(true));

        /* Log Levels */
        java.util.logging.Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.SEVERE);
        java.util.logging.Logger.getLogger("javax.enterprise.system").setLevel(Level.SEVERE);
        java.util.logging.Logger.getLogger("fish.payara.nucleus.healthcheck").setLevel(Level.SEVERE);
        org.glassfish.ejb.LogFacade.getLogger().setLevel(Level.SEVERE);

        return war;
    }

    protected void setSynchronous() {
        populatorScheduler.setBroadcast(false);
        populatorScheduler.setAsync(false);
    }

    @BeforeClass
    public static void initJCR() {
        try {
            // init JCR resitory
            SessionManager.getSession();
        } catch (RepositoryException ex) {
        }
    }

    /**
     * Initial db content as defined by Liquibase Changelogs
     */
    @Before
    public void init() {
        this.startTime = System.currentTimeMillis();
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
        TestHelper.cleanData();

        requestManager.setPlayer(null);
        requestManager.clearEntities();
        helperBean.wipeCache();

        this.setSynchronous();

        this.startTime = System.currentTimeMillis();
        TestHelper.emptyDBTables();
        this.wipeEmCache();
        requestFacade.setPlayer(null);

        requestFacade.clearEntities();

        //requestManager.clearPermissions();
        this.wipeEmCache();
        userFacade.logout();
        DataSource ds;
        try {
            ds = (DataSource) new InitialContext().lookup("jdbc/wegas_dev");
        } catch (NamingException ex) {
            throw WegasErrorMessage.error("No jdbc/wegas_dev !!!");
        }

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
        } catch (SQLException ex) {
            throw WegasErrorMessage.error("SQL Initialisation failed !");
        }

        try {
            this.admins = roleFacade.findByName("Administrator");
            this.scenarists = roleFacade.findByName("Scenarist");
            this.trainers = roleFacade.findByName("Trainer");
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Fails to fetch role");
        }

        this.admin = new WegasUser(userFacade.find(1l), "root", "1234");
        login(admin);

    }

    @After
    public void clean() {
        long now = System.currentTimeMillis();
        logger.error("TEST {} DURATION: total: {} ms; init: {} ms; test: {} ms",
                name.getMethodName(),
                now - this.startTime,
                this.initTime - this.startTime,
                now - this.initTime);

        requestManager.setPlayer(null);
        requestManager.clearEntities();
        helperBean.wipeCache();
    }

    protected void wipeEmCache() {
        this.helperBean.wipeCache();
    }

    public void logout() {
        userFacade.logout();
    }

    public void login(WegasUser user) {
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

    public User login(String username, String password) {
        Subject subject = SecurityUtils.getSubject();
        userFacade.logout();
        subject.login(new UsernamePasswordToken(username, password));
        return userFacade.getCurrentUser();
    }

    public WegasUser signup(String email, String password) {
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

    public WegasUser signup(String email) {
        return signup(email, Helper.genRandomLetters(10));
    }

    public WegasUser guestLogin() {
        /*AuthenticationInformation authInfo = new AuthenticationInformation();
        authInfo.setRemember(true);*/
        return new WegasUser(userFacade.guestLogin(), null, null);
    }

    public WegasUser addRoles(WegasUser user, Role... roles) {
        User u = userFacade.find(user.user.getId());
        for (Role role : roles) {
            userFacade.addRole(u.getId(), role.getId());
        }
        //userFacade.merge(user);
        user.user = userFacade.find(u.getId());
        return user;
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
