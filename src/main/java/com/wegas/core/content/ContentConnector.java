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
package com.wegas.core.content;

import java.io.InputStream;
import java.util.Calendar;
import java.util.Date;
import java.util.ResourceBundle;
import javax.jcr.*;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ContentConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(ContentConnector.class);
    final private ResourceBundle resourceBundle = ResourceBundle.getBundle("wegas");
    final private SimpleCredentials admin = new SimpleCredentials(resourceBundle.getString("jcr.admin.username"), resourceBundle.getString("jcr.admin.password").toCharArray());
    private Repository repo;
    private Session session;
    private String workspace = null;

    protected ContentConnector(Long gameModelId) throws RepositoryException {
        this.workspace = "GM_" + gameModelId;
        this.repositoryLookup();

    }

    protected ContentConnector() throws RepositoryException {
        this.repositoryLookup();
    }

    protected Node getNode(String absolutePath) throws RepositoryException {
        try {
            return session.getNode(absolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Could not retrieve node ({})", ex.getMessage());
            return null;
        }
    }

    protected boolean nodeExist(String absolutePath) throws RepositoryException {
        return session.nodeExists(absolutePath);
    }

    protected void deleteFile(String absolutePath) throws RepositoryException {
        this.getNode(absolutePath).remove();
        session.save();
    }

    protected NodeIterator listChildren(String path) throws PathNotFoundException, RepositoryException {
        return session.getNode(path).getNodes(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + "*");
    }

    /*
     * Property getters and setters
     */
    private Property getProperty(String absolutePath, String propertyName) throws RepositoryException {
        Node node = this.getNode(absolutePath);
        if (node == null) {
            return null;
        } else {
            try {
                return node.getProperty(propertyName);
            } catch (PathNotFoundException ex) {
                logger.debug("Inexistant property ({}) on Node[{}]", propertyName, absolutePath);
            }
        }
        return null;
    }

    protected InputStream getData(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getStream();
    }

    protected Node setData(String absolutePath, String mimeType, InputStream data) throws RepositoryException {
        Node newNode = this.getNode(absolutePath);
        newNode.setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
        newNode.setProperty(WFSConfig.WFS_DATA, session.getValueFactory().createBinary(data));
        newNode.setProperty(WFSConfig.WFS_LAST_MODIFIED, Calendar.getInstance());
        this.save();
        return newNode;
    }

    protected String getMimeType(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_MIME_TYPE).getString();
    }

    protected void setMimeType(String absolutePath, String mimeType) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
    }

    protected String getNote(String absolutePath) throws RepositoryException {
        try {
            return this.getProperty(absolutePath, WFSConfig.WFS_NOTE).getString();
        } catch (NullPointerException ex) {
            return "";
        }
    }

    protected void setNote(String absolutePath, String note) throws RepositoryException {
        note = note == null ? "" : note;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_NOTE, note);
    }

    protected String getDescription(String absolutePath) throws RepositoryException {
        try {
            return this.getProperty(absolutePath, WFSConfig.WFS_DESCRIPTION).getString();
        } catch (NullPointerException ex) {
            return "";
        }
    }

    protected void setDescription(String absolutePath, String description) throws RepositoryException {
        description = description == null ? "" : description;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_DESCRIPTION, description);

    }

    protected Calendar getLastModified(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_LAST_MODIFIED).getDate();
    }

    protected Long getSize(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getSize();
    }

    /**
     * Jackrabbit doesn't handle workspace deletetion
     *
     * @throws RepositoryException, UnsupportedOperationException
     */
    public void deleteWorkspace() throws RepositoryException {
        throw new UnsupportedOperationException("Jackrabbit: There is currently no programmatic way to delete workspaces. You can delete a workspace by manually removing the workspace directory when the repository instance is not running.");
//        String name = session.getWorkspace().getName();
//        this.close();
//        session = repo.login(admin);
//        session.getWorkspace().deleteWorkspace(name);
    }

    protected void save() throws RepositoryException {
        if (session.isLive()) {
            session.save();
        }
    }

    public void close() {
        try {
            if (session.isLive()) {
                session.save();
                session.logout();
            }
        } catch (RepositoryException ex) {
        }
    }

    private void repositoryLookup() throws RepositoryException {

        this.repo = (Repository) new JackrabbitConnector().getRepo();
        if (this.repo == null) {
            logger.error("Repository initialization failed ");
            throw new RepositoryException("JCR initialization failed");
        }
        try {
            session = repo.login(admin, this.workspace);
        } catch (RepositoryException exception) {
            session = repo.login(admin);
            session.getWorkspace().createWorkspace(this.workspace);
            this.close();
            session = repo.login(admin, this.workspace);
        }

        this.initializeNamespaces();
    }

    /**
     * Check for custom namespaces and register them if they don't exist
     *
     * @throws RepositoryException
     */
    private void initializeNamespaces() throws RepositoryException {
        for (String prefix : WFSConfig.namespaces.keySet()) {
            try {
                session.getWorkspace().getNamespaceRegistry().getURI(prefix);
            } catch (NamespaceException e) {
                session.getWorkspace().getNamespaceRegistry().registerNamespace(prefix, WFSConfig.namespaces.get(prefix));
            }
        }
    }

    /**
     * Ensure garbage collector closes the session.
     *
     * @throws Throwable
     */
    @Override
    protected void finalize() throws Throwable {
        try {
            this.close();
        } finally {
            super.finalize();
        }
    }
}
