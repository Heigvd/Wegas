/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.wegas.core.Helper;

import javax.jcr.Repository;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class SessionManager {

    final static private SimpleCredentials admin = new SimpleCredentials(Helper.getWegasProperty("jcr.admin.username"), Helper.getWegasProperty("jcr.admin.password").toCharArray());

    /**
     * @param repository
     * @return
     * @throws RepositoryException
     */
    public static Session getSession(String repository) throws RepositoryException {
        Session session;
        final Repository repo = JackrabbitConnector.getRepo();
        try {
            session = repo.login(admin, repository);
        } catch (javax.jcr.NoSuchWorkspaceException ex) {
            createWorkspace(repository);
            session = repo.login(admin, repository);
        }
        return session;
    }

    /**
     * @param session
     */
    public static void closeSession(Session session) {
        if (session.isLive()) {
            session.logout();
        }
    }

    /**
     * @param repository
     * @throws RepositoryException
     */
    private static void createWorkspace(String repository) throws RepositoryException {
        final Session adminSession = getSession(null);
        adminSession.getWorkspace().createWorkspace(repository);
        closeSession(adminSession);
    }

    public static void removeWorkspace(Session session) {
        final String workspace = session.getWorkspace().getName();
        if (workspace.startsWith("GM_") && !workspace.equals("GM_0")) { // Allow only deleting File repo
            closeSession(session);
            JackrabbitConnector.deleteWorkspaceDirectory(workspace);
        }
    }

}
