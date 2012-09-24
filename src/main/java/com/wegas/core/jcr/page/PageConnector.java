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
package com.wegas.core.jcr.page;

import com.wegas.core.jcr.JackrabbitConnector;
import java.util.ResourceBundle;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.ejb.DependsOn;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.PathNotFoundException;
import javax.jcr.Repository;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@DependsOn({"JackrabbitConnector"})
@Startup
@Singleton
public class PageConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageConnector.class);
    final private ResourceBundle resourceBundle = ResourceBundle.getBundle("wegas");
    final private SimpleCredentials admin = new SimpleCredentials(resourceBundle.getString("jcr.admin.username"), resourceBundle.getString("jcr.admin.password").toCharArray());
    private static Repository repo;
    private static Session session = null;

    @PostConstruct
    private void init() {
        PageConnector.repo = (Repository) new JackrabbitConnector().getRepo();
        if (PageConnector.repo == null) {
            logger.error("Repository initialization failed ");
        }
    }

    private Node getRootNode(String gameModelName) throws RepositoryException {
        Node ret = null;
        try {
            ret = this.getSession().getRootNode().getNode(gameModelName);
        } catch (PathNotFoundException ex) {
            logger.info("Could not retrieve node ({}), creating it.", ex.getMessage());
            NodeIterator ni = this.getSession().getRootNode().getNodes();
            while (ni.hasNext()) {
                logger.debug(((Node) ni.next()).getPath());
            }
            ret = this.getSession().getRootNode().addNode(gameModelName);

        } finally {
            return ret;
        }
    }

    protected NodeIterator listChildren(String gameModelName) throws PathNotFoundException, RepositoryException {
        NodeIterator ni = this.getRootNode(gameModelName).getNodes();
        return ni;
    }

    protected Node getChild(String gameModelName, String path) throws RepositoryException {
        try {
            return this.getRootNode(gameModelName).getNode(path);
        } catch (PathNotFoundException ex) {
            return null;
        }
    }

    protected Node addChild(String gameModelName, String name) throws RepositoryException {
        Node root = this.getRootNode(gameModelName);
        if (!root.hasNode(name)) {
            Node node = root.addNode(name);
            node.getSession().save();
            return node;
        } else {
            return this.getChild(gameModelName, name);
        }
    }

    protected void save() throws RepositoryException {
        if (PageConnector.session.isLive()) {
            PageConnector.session.save();
        }
    }

    private Session getSession() throws RepositoryException {
        if (PageConnector.session == null || !PageConnector.session.isLive()) {
            try {
                PageConnector.session = PageConnector.repo.login(admin, "Pages");
            } catch (RepositoryException ex) {
                Session s;
                s = PageConnector.repo.login(admin);
                s.getWorkspace().createWorkspace("Pages");
                s.logout();
                PageConnector.session = PageConnector.repo.login(admin, "Pages");
            }
        }
        return PageConnector.session;

    }

    @PreDestroy
    private void close() {
        if (PageConnector.session != null && PageConnector.session.isLive()) {
            PageConnector.session.logout();
        }
    }
}
