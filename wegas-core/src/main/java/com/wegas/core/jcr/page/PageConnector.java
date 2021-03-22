/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.SessionManager;
import com.wegas.core.jcr.content.WFSConfig;
import com.wegas.core.jcr.jta.JTARepositoryConnector;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class PageConnector extends JTARepositoryConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageConnector.class);
    private static final long serialVersionUID = 1317346293333627485L;

    private final Session session;
    private final Long gameModelId;

    private Boolean managed = false;

    /**
     * Package protected constructor
     *
     * @param gameModelId
     *
     * @throws RepositoryException
     */
    /* package */ PageConnector(Long gameModelId) throws RepositoryException {
        this.session = SessionManager.getSession();
        this.gameModelId = gameModelId;
    }

    @Override
    public void setManaged(boolean managed) {
        this.managed = managed;
    }

    @Override
    public boolean getManaged() {
        return this.managed;
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

    public String getRootPath() {
        return WFSConfig.PAGES_ROOT.apply(this.gameModelId);
    }

    protected NodeIterator listChildren() throws RepositoryException {
        Node rootNode = this.getRootNode();
        return rootNode.getNodes();
    }

    /**
     * @return childre NodeIterator
     *
     * @throws RepositoryException
     */
    /*protected NodeIterator listChildren() throws RepositoryException {
        return this.query("Select * FROM [nt:base] as n WHERE ISDESCENDANTNODE('" + WFSConfig.PAGES_ROOT.apply(this.gameModelId) + "') order by n.index, localname(n)");
    }*/

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
     *
     * @return child matching the path or null if there is no such child
     *
     * @throws RepositoryException
     */
    protected Node getChild(String path) throws RepositoryException {
        try {
            return this.getRootNode().getNode(path);
        } catch (PathNotFoundException ex) {
            return null;
        }
    }

    /**
     *
     * @param name
     *
     * @return the child
     *
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
     *
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

    @Override
    public void prepare() {
        try {
            this.getRootNode();
        } catch (RepositoryException ex) {
            throw WegasErrorMessage.error("PLEASE ROLLBACK " + ex);
        }
    }

    @Override
    public void commit() {
        try {
            session.save();
        } catch (RepositoryException ex) {
            //should never happened !!!!!
            logger.error("Pages Commit FAILURE: {}", ex);
        }
        this.runCommitCallbacks();
        SessionManager.closeSession(session);
        this.runAfterCommitCallbacks();
    }

    @Override
    public void rollback() {
        this.runRollbackCallbacks();
        SessionManager.closeSession(session);
    }
}
