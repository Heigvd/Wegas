/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.test.arquillian;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.JPACacheHelper;
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
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.AuthenticationInformation;
import com.wegas.core.security.util.AuthenticationMethod;
import com.wegas.core.security.util.JpaAuthentication;
import com.wegas.test.TestHelper;
import com.wegas.test.WegasFactory;
import java.io.File;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.logging.Level;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.mail.internet.AddressException;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.Ini;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.env.IniWebEnvironment;
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
 * Test with minimal dataset: root user. Administrator, Scenarist, trainer roles
 *
 * @author maxence
 */
@RunWith(Arquillian.class)
public abstract class AbstractArquillianTestMinimal {

    protected static final Logger logger = LoggerFactory.getLogger(AbstractArquillianTestMinimal.class);

    @Inject
    protected GameModelFacade gameModelFacade;

    @Inject
    protected GameFacade gameFacade;

    @Inject
    protected TeamFacade teamFacade;

    @Inject
    protected RoleFacade roleFacade;

    @Inject
    protected UserFacade userFacade;

    @Inject
    protected AccountFacade accountFacade;

    @Inject
    protected PlayerFacade playerFacade;

    @Inject
    protected VariableDescriptorFacade variableDescriptorFacade;

    @Inject
    protected VariableInstanceFacade variableInstanceFacade;

    @Inject
    protected ScriptFacade scriptFacade;

    @Inject
    protected JPACacheHelper jpaCacheHelper;

    @Inject
    protected RequestFacade requestFacade;

    @Inject
    protected RequestManager requestManager;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    protected WegasFactory wegasFactory;

    @Rule
    public TestName testName = new TestName();

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
        logger.info("Start TEST {}", testName.getMethodName());

        this.startTime = System.currentTimeMillis();

        Ini ini = Ini.fromResourcePath("classpath:shiro.ini");
        IniWebEnvironment env = new IniWebEnvironment();
        env.setIni(ini);
        env.init();

        //SecurityUtils.setSecurityManager(env.getSecurityManager());
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
        TestHelper.emptyDBTables();

        requestManager.clearEntities();
        this.wipeEmCache();

        this.setSynchronous();

        this.startTime = System.currentTimeMillis();
        this.wipeEmCache();

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
            String setupQuery = ""
                + "INSERT INTO roles (id, name, description) VALUES (1, 'Administrator', '');"
                + "INSERT INTO roles (id, name, description) VALUES (2, 'Scenarist', '');"
                + "INSERT INTO roles (id, name, description) VALUES (3, 'Trainer', '');"
                + "INSERT INTO permission (id, permissions, role_id) VALUES (1, 'GameModel:*:*', 1);"
                + "INSERT INTO permission (id, permissions, role_id) VALUES (2, 'Game:*:*', 1);"
                + "INSERT INTO permission (id, permissions, role_id) VALUES (3, 'User:*:*', 1);"
                + "INSERT INTO users (id) VALUES (1);"
                + "INSERT INTO accountdetails (id, email, checkuniqueness) VALUES (1, 'root@localhost', true);"
                + "INSERT INTO shadow (id, hashmethod, passwordhex, salt) VALUES (1, 'SHA_256', 'eb86410aa029d4f7b85c1b4c3c0a25736f9ae4806bd75d456a333d83b648f2ee', '69066d73c2d03f85c5a8d3e39a2f184f');"
                + "INSERT INTO abstractaccount (id, username, emaildomain, currentauth, dtype, user_id, shadow_id, details_id) VALUES (1, 'root', 'localhost', 'PLAIN', 'JpaAccount', 1, 1, 1);"
                + "INSERT INTO users_roles (user_id, role_id) VALUES (1, 1);"
                + "UPDATE sequence SET seq_count=seq_count+50 WHERE seq_name = 'SEQ_GEN';"
                + "CREATE UNIQUE INDEX IF NOT EXISTS index_accountdetails_email ON accountdetails (email) WHERE (checkuniqueness AND email IS NOT NULL AND email <> '');"
                + "CREATE UNIQUE INDEX IF NOT EXISTS index_abstractaccount_username ON abstractaccount (username) WHERE (dtype = 'JpaAccount' AND username IS NOT NULL AND username NOT LIKE '');"
                + "CREATE UNIQUE INDEX IF NOT EXISTS index_abstractaccount_persistentid ON abstractaccount (persistentid) WHERE (dtype = 'AaiAccount');"
                + "CREATE INDEX IF NOT EXISTS index_listDesc_allowedType ON listdescriptor_allowedtypes (listdescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_numberinstance_history_numberinstance_id ON numberinstance_history (numberinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_objectdescriptor_properties_objectdescriptor_id ON objectdescriptor_properties (objectdescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_objectinstance_properties_objectinstance_id ON objectinstance_properties (objectinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_resourcedescriptor_properties_resourcedescriptor_id ON resourcedescriptor_properties (resourcedescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_resourceinstance_properties_resourceinstance_id ON resourceinstance_properties (resourceinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_taskdescriptor_taskdescriptor_pred ON taskdescriptor_taskdescriptor (predecessor_id);"
                + "CREATE INDEX IF NOT EXISTS index_taskdescriptor_taskdescriptor_task ON taskdescriptor_taskdescriptor (taskdescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_users_roles_role_id ON users_roles (role_id);"
                + "CREATE INDEX IF NOT EXISTS index_users_roles_user_id ON users_roles (user_id);"
                + "CREATE INDEX IF NOT EXISTS index_taskinstance_plannification_taskinstance_id ON taskinstance_plannification (taskinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_taskinstance_properties_taskinstance_id ON taskinstance_properties (taskinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_taskdescriptor_properties_taskdescriptor_id ON taskdescriptor_properties (taskdescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_transitionhistory_statemachineinstance_id ON transitionhistory (statemachineinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_iteration_taskinstance_iteration_id on iteration_taskinstance (iteration_id);"
                + "CREATE INDEX IF NOT EXISTS index_iteration_taskinstance_id on iteration_taskinstance (taskinstance_id);"
                + "CREATE INDEX IF NOT EXISTS index_mcqresult_name_choicedescriptor_id on mcqresult (name,choicedescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_questiondescriptor_pictures_questiondescriptor_id on questiondescriptor_pictures (questiondescriptor_id);"
                + "CREATE INDEX IF NOT EXISTS index_result_files_result_id on result_files (result_id);"
                + "CREATE INDEX IF NOT EXISTS index_taskdescriptor_taskdescriptor_taskdescriptor_id_predecessor_id on taskdescriptor_taskdescriptor (taskdescriptor_id,predecessor_id);"
                + "CREATE INDEX IF NOT EXISTS index_users_roles_roles_id_user_id on users_roles (role_id,user_id);"
                + "CREATE UNIQUE INDEX IF NOT EXISTS index_game_token ON game (token) WHERE (status = 'LIVE' OR status = 'BIN');"
                + "CREATE INDEX IF NOT EXISTS index_surveydescriptor_token_surveys_id on surveydescriptor_token (surveys_id);"
                + "CREATE INDEX IF NOT EXISTS index_surveydescriptor_token_tokens_id on surveydescriptor_token (tokens_id);";

            statement.execute(setupQuery);
        } catch (SQLException ex) {
            logger.error("SQL Initialisation: {}", ex);
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

        this.initTime = System.currentTimeMillis();
        requestManager.clearEntities();
    }

    @After
    public void clean() {
        long now = System.currentTimeMillis();
        logger.info("TEST {} DURATION: total: {} ms; init: {} ms; test: {} ms",
            testName.getMethodName(),
            now - this.startTime,
            this.initTime - this.startTime,
            now - this.initTime);

        requestManager.clearEntities();

        this.wipeEmCache();
    }

    protected void wipeEmCache() {
        this.jpaCacheHelper.requestClearCache();
    }

    public void logout() {
        userFacade.logout();
    }

    public void login(WegasUser user) {
        Subject subject = SecurityUtils.getSubject();
        if (user.isGuest()) {
            GuestToken guestToken = new GuestToken(user.getUser().getMainAccount().getId());
            userFacade.logout();
            requestManager.login(subject, guestToken);
        } else {
            userFacade.logout();

            List<AuthenticationMethod> authMethods = userFacade.getAuthMethods(user.getUsername());
            JpaAuthentication jpaAuth = null;
            for (AuthenticationMethod m : authMethods) {
                if (m instanceof JpaAuthentication) {
                    jpaAuth = (JpaAuthentication) m;
                    break;
                }
            }
            if (jpaAuth != null) {

                AuthenticationInformation info = new AuthenticationInformation();
                info.setAgreed(Boolean.TRUE);
                info.setLogin(user.getUsername());

                info.addHash(jpaAuth.getMandatoryMethod(), user.getPassword(),
                    Helper.coalesce(jpaAuth.getSalt()));

                info.addHash(jpaAuth.getOptionalMethod(), user.getPassword(),
                    Helper.coalesce(jpaAuth.getNewSalt(), jpaAuth.getSalt()));

                info.setRemember(true);

                userFacade.authenticate(info);

                // is that really useful to login again ?
                /*String hash = info.getHashes().get(
                    jpaAuth.getOptionalMethod() != null
                    ? jpaAuth.getOptionalMethod() : jpaAuth.getMandatoryMethod()
                );
                requestManager.login(subject, new UsernamePasswordToken(user.getUsername(),
                    info.getHashes().get(hash)));
                 */
                requestManager.setPlayer(null);
            } else {
                throw WegasErrorMessage.error("Not a JPA Account");
            }
        }

        User currentUser = userFacade.getCurrentUser();
        if (!currentUser.equals(user.getUser())) {
            throw WegasErrorMessage.error("LOGIN FAILURE");
        }
    }

    public User login(String username, String password) {
        Subject subject = SecurityUtils.getSubject();
        userFacade.logout();
        requestManager.login(subject, new UsernamePasswordToken(username, password));
        return userFacade.getCurrentUser();
    }

    public WegasUser signup(String email, String password) {
        logout();
        JpaAuthentication authMethod = userFacade.getDefaultAuthMethod();

        String hash = authMethod.getMandatoryMethod().hash(password,
            Helper.coalesce(authMethod.getSalt()));

        JpaAccount ja = new JpaAccount();
        ja.setEmail(email);
        ja.setSalt(authMethod.getSalt());
        ja.setPassword(hash);
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

        userFacade.logout();
        return WegasUser.createGuest(userFacade);
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

        public static WegasUser createGuest(UserFacade userFacade) {
            WegasUser guest = new WegasUser(userFacade.guestLogin(), null, null);
            guest.guest = true;
            return guest;
        }

        private User user;
        private String username;
        private String password;
        boolean guest;

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

        public boolean isGuest() {
            return guest;
        }
    }

}
