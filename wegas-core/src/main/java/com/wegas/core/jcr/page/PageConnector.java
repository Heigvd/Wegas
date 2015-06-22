/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.wegas.core.jcr.SessionHolder;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.jcr.query.QueryResult;

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class PageConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageConnector.class);

    private final Session session;

    public PageConnector() throws RepositoryException {
        this.session = SessionHolder.getSession("Pages");
    }

    private Node getRootNode(String gameModelName) throws RepositoryException {
        Node ret;
        try {
            ret = this.session.getRootNode().getNode(gameModelName);
        } catch (PathNotFoundException ex) {
            logger.info("Could not retrieve node ({}), creating it.", ex.getMessage());
            NodeIterator ni = session.getRootNode().getNodes();
            while (ni.hasNext()) {
                logger.debug(((Node) ni.next()).getPath());
            }
            ret = session.getRootNode().addNode(gameModelName);

        }
        return ret;

    }

    /**
     * @param gameModelName
     * @return
     * @throws RepositoryException
     */
    protected NodeIterator listChildren(String gameModelName) throws RepositoryException {
        return this.query("Select * FROM [nt:base] as n WHERE ISDESCENDANTNODE('/" + gameModelName + "') order by n.index, localname(n)");
    }

    protected NodeIterator query(String query) throws RepositoryException {
        final QueryManager queryManager = session.getWorkspace().getQueryManager();
        final QueryResult result = queryManager.createQuery(query, Query.JCR_SQL2).execute();
        return result.getNodes();
    }

    /**
     * @param gameModelName
     * @param path
     * @return
     * @throws RepositoryException
     */
    protected Node getChild(String gameModelName, String path) throws RepositoryException {
        Node ret;
        try {
            ret = this.getRootNode(gameModelName).getNode(path);
        } catch (PathNotFoundException ex) {
            ret = null;
        }
        return ret;
    }

    /**
     * @param gameModelName
     * @param name
     * @return
     * @throws RepositoryException
     */
    protected Node addChild(String gameModelName, String name) throws RepositoryException {
        Node root = this.getRootNode(gameModelName);
        if (!root.hasNode(name)) {
            Node node = root.addNode(name);
            session.save();
            return node;
        } else {
            return this.getChild(gameModelName, name);
        }
    }

    /**
     * @param gameModelName
     * @param name
     * @throws RepositoryException
     */
    protected void deleteChild(String gameModelName, String name) throws RepositoryException {
        Node root = this.getRootNode(gameModelName);
        if (root.hasNode(name)) {
            root.getNode(name).remove();
            if (!root.hasNodes()) {
                root.remove();
            }
            this.save();
        }
    }

    /**
     * @param gameModelName
     * @throws RepositoryException
     */
    protected void deleteRoot(String gameModelName) throws RepositoryException {
        Node root = session.getRootNode();
        if (root.hasNode(gameModelName)) {
            root.getNode(gameModelName).remove();
            session.save();
        }
    }

    /**
     * @throws RepositoryException
     */
    protected void save() throws RepositoryException {
        session.save();
    }

    /**
     * @param gameModelName
     * @return
     * @throws RepositoryException
     */
    protected boolean exist(String gameModelName) throws RepositoryException {
        return session.getRootNode().hasNode(gameModelName);
    }

    public void close() throws RepositoryException {
        session.save();
        SessionHolder.closeSession(session);
    }
}
