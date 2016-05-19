/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.wegas.core.Helper;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.PreDestroy;
import javax.ejb.DependsOn;
import javax.ejb.Singleton;
import javax.jcr.Repository;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Singleton
@DependsOn("JackrabbitConnector")
public class SessionHolder {

    final static private SimpleCredentials admin = new SimpleCredentials(Helper.getWegasProperty("jcr.admin.username"), Helper.getWegasProperty("jcr.admin.password").toCharArray());
    private static final List<Session> sessionList = new ArrayList<>();

    /**
     *
     * @param repository
     * @return
     * @throws RepositoryException
     */
    public static Session getSession(String repository) throws RepositoryException {
        Session session;
        final Repository repo = new JackrabbitConnector().getRepo();
        try {
            session = repo.login(admin, repository);
        } catch (javax.jcr.NoSuchWorkspaceException ex) {
            createWorkspace(repository);
            session = repo.login(admin, repository);
        }
        sessionList.add(session);
        return session;
    }

    /**
     *
     * @param session
     */
    public static void closeSession(Session session) {
        if (session.isLive()) {
            session.logout();
        }
        SessionHolder.sessionList.remove(session);
    }

    /**
     *
     * @param repository
     * @throws RepositoryException
     */
    protected static void createWorkspace(String repository) throws RepositoryException {
        final Session adminSession = getSession(null);
        adminSession.getWorkspace().createWorkspace(repository);
        closeSession(adminSession);
    }

    @PreDestroy
    private void onDestroy() {
        for (Session s : sessionList) {
            if (s.isLive()) {
                s.logout();
            }
        }
        sessionList.clear();
    }
}
