/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr;

import com.wegas.core.Helper;
import org.apache.jackrabbit.commons.JcrUtils;
import org.slf4j.LoggerFactory;

import javax.jcr.Repository;
import javax.jcr.RepositoryException;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

/**
 * Jackrabbit repository init
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
class JackrabbitConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(JackrabbitConnector.class);
    final private static String DIR = Helper.getWegasProperty("jcr.repository.basedir");
    private static Repository repo;
    private static Boolean isLocal = false;

    private static void init() {
        try {
            try {
                new URL(DIR);
                repo = JcrUtils.getRepository(DIR + "/server");
            } catch (MalformedURLException e) {
                Map<String, String> prop = new HashMap<>();
                prop.put("org.apache.jackrabbit.repository.home", DIR);
                prop.put("org.apache.jackrabbit.repository.conf", DIR + "/repository.xml");
                repo = JcrUtils.getRepository(prop);
                isLocal = true;
            }
        } catch (RepositoryException ex) {
            logger.error("Check your repository setup {}", DIR);
        }
    }

    /**
     * @return Repository
     */
    protected static Repository getRepo() {
        if (JackrabbitConnector.repo == null) {
            JackrabbitConnector.init();
        }
        return JackrabbitConnector.repo;
    }

    /**
     * Delete workspace Directory
     *
     * @param workspaceName directory to delete.
     */

    static void deleteWorkspaceDirectory(String workspaceName) {
        if (isLocal) {
            try {
                Helper.recursiveDelete(new File(DIR + "/workspaces/" + workspaceName));
            } catch (IOException ex) {
                logger.warn("Delete workspace files failed", ex);
            }
        }
    }
}
