/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.GameModel;

import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.ejb.EJB;
import javax.ejb.Schedule;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.sql.DataSource;

import org.apache.jackrabbit.api.JackrabbitRepository;
import org.apache.jackrabbit.api.JackrabbitRepositoryFactory;
import org.apache.jackrabbit.api.management.DataStoreGarbageCollector;
import org.apache.jackrabbit.api.management.RepositoryManager;
import org.apache.jackrabbit.core.RepositoryFactoryImpl;
import org.slf4j.LoggerFactory;

/**
 * Implementation specific garbageCollector
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Startup
@Singleton
public class JackrabbitConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(JackrabbitConnector.class);
    final private static String DIR = Helper.getWegasProperty("jcr.repository.basedir");
    private static JackrabbitRepository repo;
    final private JackrabbitRepositoryFactory rf = new RepositoryFactoryImpl();

    @PersistenceContext(name = "wegasPU")
    private EntityManager em;

    @PostConstruct
    protected void init() {
        Properties prop = new Properties();
        prop.setProperty("org.apache.jackrabbit.repository.home", DIR);
        prop.setProperty("org.apache.jackrabbit.repository.conf", DIR + "/repository.xml");
        try {
            repo = (JackrabbitRepository) rf.getRepository(prop);
            logger.info("Jackrabbit will read setup from {}", DIR);
        } catch (RepositoryException ex) {
            logger.error("Check your repository setup {}", DIR);
        }
        //Enable GC on startup
        //this.runGC();
    }

    @Schedule(hour = "3", minute = "0")
    private void runGC() {
        try {
            logger.info("Running Jackrabbit GarbageCollector");
            final RepositoryManager rm = rf.getRepositoryManager(JackrabbitConnector.repo);
            final Session session = SessionHolder.getSession(null);
            Integer countDeleted = 0;
            DataStoreGarbageCollector gc = rm.createDataStoreGarbageCollector();
            try {
                gc.mark();
                countDeleted = gc.sweep();
            } finally {
                gc.close();
            }

            SessionHolder.closeSession(session);
            rm.stop();
            logger.info("Jackrabbit GarbageCollector ended, {} items removed", countDeleted);
        } catch (RepositoryException ex) {
            logger.error("Jackrabbit garbage collector failed. Check repository configuration");
        }
    }

    /**
     * Project specific, remove database's table and jcr filesystem workspace
     *
     * @param toDelete
     */
    private static void deleteWorkspaces(List<String> toDelete) {
        String dbName = Helper.getWegasProperty("jcr.jdbc.resource-name");
        try {
            DataSource ds = (DataSource) new InitialContext().lookup(dbName);
            try (Connection con = ds.getConnection()) {
                for (String workspaceName : toDelete) {
                    logger.warn("Delete " + workspaceName);
                    try (Statement statement = con.createStatement()) {
                        try {
                            /* DROP TABLES */
                            String dropQuery = "DROP table IF EXISTS "
                                    + workspaceName + "_binval, "
                                    + workspaceName + "_refs, "
                                    + workspaceName + "_bundle, "
                                    + workspaceName + "_names CASCADE";

                            statement.execute(dropQuery);
                            con.commit();
                            /* DELETE WORKSPACE */
                            try {
                                Helper.recursiveDelete(new File(DIR + "/workspaces/" + workspaceName));
                            } catch (IOException ex) {
                                logger.warn("Delete workspace files failed", ex);
                            }
                        } catch (SQLException ex) {
                            logger.warn("Delete workspace failed", ex);
                            statement.cancel();
                            con.rollback();
                        }
                    }
                }

            } catch (SQLException ex) {
                logger.warn("Delete workspace failed: getConnection failed");
            }
        } catch (NamingException ex) {
            logger.warn("Delete workspace failed: no \"" + dbName + "\" resource found");
        }
    }

    /**
     * @return
     */
    protected javax.jcr.Repository getRepo() {
        return JackrabbitConnector.repo;
    }

    @PreDestroy
    private void close() {
        try {
            //Build a list of workspace which have no more dependant gameModel
            Session admin = SessionHolder.getSession(null);
            String[] workspaces = admin.getWorkspace().getAccessibleWorkspaceNames();
            SessionHolder.closeSession(admin);
            final List<GameModel> gameModels = em.createNamedQuery("GameModel.findAll", GameModel.class).getResultList();
            final List<String> fakeWorkspaces = new ArrayList<>();
            final List<String> toDelete = new ArrayList<>();
            for (GameModel gameModel : gameModels) {
                fakeWorkspaces.add("GM_" + gameModel.getId());
            }
            for (String workspace : workspaces) {
                if (workspace.startsWith("GM_") && !workspace.equals("GM_0")) {
                    if (!fakeWorkspaces.contains(workspace)) {
                        toDelete.add(workspace);
                        logger.info("Marked for deletion : {}", workspace);
                    }
                }
            }
            //run garbage collector
            this.runGC();
            JackrabbitConnector.repo.shutdown();
            // delete marked for deletion
            deleteWorkspaces(toDelete);
        } catch (RepositoryException ex) {
            logger.warn("Unable to close repository: " + ex.getMessage());
        }
    }
}
