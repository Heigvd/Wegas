/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.wegas.core.Helper;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.PreDestroy;
import javax.ejb.DependsOn;
import javax.ejb.Singleton;
import javax.jcr.Repository;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Singleton
@DependsOn("JackrabbitConnector")
public class SessionHolder {

    final static private SimpleCredentials admin = new SimpleCredentials(Helper.getWegasProperty("jcr.admin.username"), Helper.getWegasProperty("jcr.admin.password").toCharArray());
    private static Map<String, Session> sessionMap = new HashMap<>();

    /**
     *
     * @param repository
     * @return
     * @throws RepositoryException
     */
    public static Session getSession(String repository) throws RepositoryException {
        Session session;
        if (!SessionHolder.sessionMap.containsKey(repository) || !SessionHolder.sessionMap.get(repository).isLive()) {
            Repository repo = (Repository) new JackrabbitConnector().getRepo();
            sessionMap.remove(repository);
            try {
                session = repo.login(admin, repository);
            } catch (javax.jcr.NoSuchWorkspaceException ex) {
                createWorkspace(repository);
                session = repo.login(admin, repository);
            }
            sessionMap.put(repository, session);
        }
        return sessionMap.get(repository);
    }

    /**
     *
     * @param repository
     * @throws RepositoryException
     */
    public static void closeSession(String repository) throws RepositoryException {
        if (SessionHolder.sessionMap.containsKey(repository) && SessionHolder.sessionMap.get(repository).isLive()) {
            SessionHolder.sessionMap.get(repository).save();
            SessionHolder.sessionMap.get(repository).logout();
        }
        SessionHolder.sessionMap.remove(repository);
    }

    /**
     *
     * @param repository
     * @throws RepositoryException
     */
    protected static void createWorkspace(String repository) throws RepositoryException {
        Session s;

        s = getSession(null);
        s.getWorkspace().createWorkspace(repository);
    }

    @PreDestroy
    private void onDestroy() {
        for (Session s : sessionMap.values()) {
            if (s.isLive()) {
                s.logout();
            }
        }
        sessionMap.clear();
    }
}
