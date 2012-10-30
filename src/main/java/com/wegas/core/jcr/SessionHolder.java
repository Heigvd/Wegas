/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.jcr;

import java.util.HashMap;
import java.util.Map;
import java.util.ResourceBundle;
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
@DependsOn({"JackrabbitConnector"})
@Singleton
public class SessionHolder {

    final static private ResourceBundle resourceBundle = ResourceBundle.getBundle("wegas");
    final static private SimpleCredentials admin = new SimpleCredentials(resourceBundle.getString("jcr.admin.username"), resourceBundle.getString("jcr.admin.password").toCharArray());
    private static Map<String, Session> sessionMap = new HashMap<>();

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

    public static void closeSession(String repository) throws RepositoryException {
        if (SessionHolder.sessionMap.containsKey(repository) && SessionHolder.sessionMap.get(repository).isLive()) {
            SessionHolder.sessionMap.get(repository).save();
            SessionHolder.sessionMap.get(repository).logout();
        }
        SessionHolder.sessionMap.remove(repository);
    }

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
