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
import com.wegas.core.ejb.TestHelper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.File;
import java.util.logging.Level;
import javax.ejb.EJB;
import javax.inject.Inject;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.importer.ExplodedImporter;
import org.jboss.shrinkwrap.api.spec.JavaArchive;
import org.junit.After;
import org.junit.Before;
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

    static {
        String clusterNameKey = "wegas.hazelcast.clustername";
        String clusterName = "hz_wegas_test_cluster_" + Helper.genToken(5);
        System.setProperty(clusterNameKey, clusterName);
    }

    @Deployment
    public static JavaArchive createDeployement() {
        JavaArchive war = ShrinkWrap.create(JavaArchive.class).
                as(ExplodedImporter.class).importDirectory(new File("../wegas-core/target/embed-classes/")).
                as(JavaArchive.class);

        //war.addPackages(true, "com.wegas");
        //war.addAsDirectory("target/embed-classes/");
        //war.addAsResource("./src/test/resources/META-INF/persistence.xml", "META-INF/persistence.xml");
        //logger.error("MyWegasArchive: {}", war.toString(true));
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());

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

    @Before
    public void init() {
        this.setSynchronous();

        guest = userFacade.guestLogin();
        requestManager.setCurrentUser(guest);
    }

    @After
    public void clean() {
        requestManager.setPlayer(null);
        requestManager.clearUpdatedEntities();
        requestManager.clearDestroyedEntities();
        requestManager.clearOutdatedEntities();
        TestHelper.cleanData();
        helperBean.wipeCache();
    }

    protected void wipeEmCache() {
        this.helperBean.wipeCache();
    }
}
