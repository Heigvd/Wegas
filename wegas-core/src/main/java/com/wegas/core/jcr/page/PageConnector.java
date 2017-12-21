/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.wegas.core.jcr.SessionManager;
import com.wegas.core.jcr.content.WFSConfig;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class PageConnector implements AutoCloseable{

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageConnector.class);

    private final Session session;
    private Long gameModelId;

    public PageConnector(Long gameModelId) throws RepositoryException {
        this.session = SessionManager.getSession();
        this.gameModelId = gameModelId;
    }

    private Node getRootNode() throws RepositoryException {
        Node ret;
        try {
            ret = this.session.getNode(this.getRootPath());
        } catch (PathNotFoundException ex) {
            logger.info("Could not retrieve node ({}), creating it.", ex.getMessage());
            ret = SessionManager.createPath(this.session, this.getRootPath());
        }
        return ret;

    }
    public String getRootPath(){
        return WFSConfig.PAGES_ROOT.apply(this.gameModelId);
    }
    /**
     * @return childre NodeIterator
     * @throws RepositoryException
     */
    protected NodeIterator listChildren() throws RepositoryException {
        return this.query("Select * FROM [nt:base] as n WHERE ISDESCENDANTNODE('" + WFSConfig.PAGES_ROOT.apply(this.gameModelId) + "') order by n.index, localname(n)");
    }

    protected NodeIterator query(final String query) throws RepositoryException {
        return this.query(query, -1, -1);
    }

    protected NodeIterator query(final String query, final int limit) throws RepositoryException {
        return this.query(query, limit, -1);
    }

    private NodeIterator query(final String query, final int limit, final int offset) throws RepositoryException {
        final QueryManager queryManager = session.getWorkspace().getQueryManager();
        final Query q = queryManager.createQuery(query, Query.JCR_SQL2);
        if (limit > 0) {
            q.setLimit(limit);
            if (offset > -1) {
                q.setOffset(offset);
            }
        }
        return q.execute().getNodes();
    }

    /**
     *
     * @param path
     * @return child matching the path
     * @throws RepositoryException
     */
    protected Node getChild(String path) throws RepositoryException {
        Node ret;
        try {
            ret = this.getRootNode().getNode(path);
        } catch (PathNotFoundException ex) {
            ret = null;
        }
        return ret;
    }

    /**
     *
     * @param name
     * @return the child
     * @throws RepositoryException
     */
    protected Node addChild(String name) throws RepositoryException {
        Node root = this.getRootNode();
        if (!root.hasNode(name)) {
            Node node = root.addNode(name);
            return node;
        } else {
            return this.getChild(name);
        }
    }

    /**
     *
     * @param name
     * @throws RepositoryException
     */
    protected void deleteChild(String name) throws RepositoryException {
        Node root = this.getRootNode();
        if (root.hasNode(name)) {
            root.getNode(name).remove();
        }
    }

    /**
     *
     * @throws RepositoryException
     */
    protected void deleteRoot() throws RepositoryException {
        this.getRootNode().remove();
    }

    /**
     * @throws RepositoryException
     */
    protected void save() throws RepositoryException {
        session.save();
    }

    @Override
    public void close() throws RepositoryException {
        session.save();
        SessionManager.closeSession(session);
    }
}
