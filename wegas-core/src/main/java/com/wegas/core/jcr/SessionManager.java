/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.wegas.core.Helper;

import javax.jcr.*;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class SessionManager {

    final static private SimpleCredentials admin = new SimpleCredentials(Helper.getWegasProperty("jcr.admin.username"), Helper.getWegasProperty("jcr.admin.password").toCharArray());

    /**
     * @return
     * @throws RepositoryException
     */
    public static Session getSession() throws RepositoryException {
        final Repository repo = JackrabbitConnector.getRepo();
        return repo.login(admin);
    }

    /**
     * @param session
     */
    public static void closeSession(Session session) {
        if (session.isLive()) {
            session.logout();
        }
    }

    public static Node createPath(Session session, String absolutePath) throws RepositoryException {
        final List<String> path = Arrays.stream(absolutePath.split("/"))
                .filter(p -> !p.equals(""))
                .collect(Collectors.toList());
        Node n = session.getRootNode();
        for (String p : path) {
            try {
                n = n.getNode(p);
            } catch (PathNotFoundException e) {
                n = n.addNode(p);
            }
        }
        return n;
    }

}
