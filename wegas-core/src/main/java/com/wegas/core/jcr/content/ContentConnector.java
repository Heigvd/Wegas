/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.wegas.core.jcr.SessionManager;
import org.apache.commons.io.IOUtils;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Calendar;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipOutputStream;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ContentConnector implements AutoCloseable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(ContentConnector.class);

    private final long gameModelId;

    final private Session session;

    private String workspaceRoot;
    private final WorkspaceType workspaceType;

    public static enum WorkspaceType {
        FILES,
        HISTORY
    }

    /**
     * @param bytes
     * @return string representation
     */
    public static String bytesToHumanReadable(Long bytes) {
        Integer unit = 1024;
        if (bytes < unit) {
            return bytes + "B";
        }
        Integer exponent = (int) (Math.log(bytes) / Math.log(unit));
        String prefix = ("KMGTPE").charAt(exponent - 1) + "";
        return String.format("%.1f%sB", bytes / Math.pow(unit, exponent), prefix);
    }

    public static ContentConnector getFilesConnector(long gameModelId) throws RepositoryException {
        return new ContentConnector(gameModelId, WorkspaceType.FILES);
    }

    public static ContentConnector getHistoryConnector(long gameModelId) throws RepositoryException {
        return new ContentConnector(gameModelId, WorkspaceType.HISTORY);
    }


    /**
     * @param gameModelId
     * @throws RepositoryException
     */
    public ContentConnector(long gameModelId, WorkspaceType workspaceType) throws RepositoryException {
        this.gameModelId = gameModelId;
        this.workspaceType = workspaceType;
        switch (workspaceType) {
            case FILES:
                this.workspaceRoot = WFSConfig.WFS_ROOT.apply(gameModelId);
                break;
            case HISTORY:
                this.workspaceRoot = WFSConfig.HISTORY_ROOT.apply(gameModelId);
                break;
        }
        this.session = SessionManager.getSession();
        if (!this.session.nodeExists(this.workspaceRoot)) {
            Node n = SessionManager.createPath(this.session, this.workspaceRoot);
            this.initializeNamespaces();
            n.setProperty(WFSConfig.WFS_MIME_TYPE, DirectoryDescriptor.MIME_TYPE);
            this.save(); // write it so that concurrent session may access it.
        }
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected Node getNode(String absolutePath) throws RepositoryException {
        try {
            return session.getNode(this.workspaceRoot + absolutePath);
        } catch (PathNotFoundException ex) {
            logger.debug("Could not retrieve node ({})", ex.getMessage());
            return null;
        }
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected boolean nodeExist(String absolutePath) throws RepositoryException {
        return session.nodeExists(this.workspaceRoot + absolutePath);
    }

    /**
     * @param absolutePath
     * @throws RepositoryException
     */
    protected void deleteNode(String absolutePath) throws RepositoryException {
        this.getNode(absolutePath).remove();
        session.save();
    }

    /**
     * @param path
     * @return
     * @throws PathNotFoundException
     * @throws RepositoryException
     */
    protected NodeIterator listChildren(String path) throws RepositoryException {
        return this.getNode(path).getNodes("*");
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

    public long getLength(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getSize();
    }

    protected InputStream getData(String absolutePath, long from, int len) throws RepositoryException, IOException {
        InputStream data = this.getData(absolutePath);
        byte[] bytes = new byte[len];
        data.skip(from);
        data.read(bytes, 0, len);

        return new ByteArrayInputStream(bytes);
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected InputStream getData(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getStream();
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     * @throws IOException
     */
    protected byte[] getBytesData(String absolutePath) throws RepositoryException, IOException {
        return IOUtils.toByteArray(this.getData(absolutePath));
    }

    /**
     * @param absolutePath
     * @param mimeType
     * @param data
     * @return
     * @throws RepositoryException
     */
    protected Node setData(String absolutePath, String mimeType, InputStream data) throws RepositoryException {
        Node newNode = this.getNode(absolutePath);
        newNode.setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
        newNode.setProperty(WFSConfig.WFS_DATA, session.getValueFactory().createBinary(data));
        newNode.setProperty(WFSConfig.WFS_LAST_MODIFIED, Calendar.getInstance());
        this.save();
        return newNode;
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected String getMimeType(String absolutePath) throws RepositoryException {
        try {
            return this.getProperty(absolutePath, WFSConfig.WFS_MIME_TYPE).getString();
        } catch (NullPointerException ex) {
            //root
            return DirectoryDescriptor.MIME_TYPE;
        }
    }

    /**
     * @param absolutePath
     * @param mimeType
     * @throws RepositoryException
     */
    protected void setMimeType(String absolutePath, String mimeType) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected String getNote(String absolutePath) throws RepositoryException {
        try {
            return this.getProperty(absolutePath, WFSConfig.WFS_NOTE).getString();
        } catch (NullPointerException ex) {
            return "";
        }
    }

    /**
     * @param absolutePath
     * @param note
     * @throws RepositoryException
     */
    protected void setNote(String absolutePath, String note) throws RepositoryException {
        note = note == null ? "" : note;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_NOTE, note);
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected String getDescription(String absolutePath) throws RepositoryException {
        try {
            return this.getProperty(absolutePath, WFSConfig.WFS_DESCRIPTION).getString();
        } catch (NullPointerException ex) {
            return "";
        }
    }

    /**
     * @param absolutePath
     * @param description
     * @throws RepositoryException
     */
    protected void setDescription(String absolutePath, String description) throws RepositoryException {
        description = description == null ? "" : description;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_DESCRIPTION, description);

    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected Calendar getLastModified(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_LAST_MODIFIED).getDate();
    }

    /**
     * Return content Bytes size
     *
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected Long getBytesSize(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getSize();
    }

    /**
     * Compress directory and children to ZipOutputStream. Warning: metadatas
     * are not included due to zip limitation
     *
     * @param out  a ZipOutputStream to write files to
     * @param path root path to compress
     * @throws RepositoryException
     * @throws IOException
     */
    public void zipDirectory(ZipOutputStream out, String path) throws RepositoryException, IOException {
        AbstractContentDescriptor node = DescriptorFactory.getDescriptor(path, this);
        DirectoryDescriptor root;
        if (node.isDirectory()) {
            root = (DirectoryDescriptor) node;
        } else {
            return;
        }
        List<AbstractContentDescriptor> list = root.list();

        ZipEntry entry;
        for (AbstractContentDescriptor item : list) {
            entry = item.getZipEntry();
            try {
                out.putNextEntry(entry);
            } catch (ZipException ex) {
                logger.warn("error");
            }
            if (item.isDirectory()) {
                zipDirectory(out, item.getFullPath());
            } else {
                byte[] write = ((FileDescriptor) item).getBytesData();
                out.write(write, 0, write.length);
            }
        }
        out.closeEntry();
    }

    /**
     * Remove root node.
     *
     * @throws RepositoryException
     */
    public void deleteRoot() throws RepositoryException {
        this.getNode("/").remove();
    }

    /**
     * @param fromGameModel
     * @throws RepositoryException
     */
    public void cloneRoot(Long fromGameModel) throws RepositoryException {
        try (ContentConnector connector = new ContentConnector(fromGameModel, workspaceType)) {
            final String fromPath = connector.getNode("/").getPath();
            this.session.refresh(true);
            final String destPath = this.getNode("/").getPath();
            this.getNode("/").remove();
            this.save();
            this.session.getWorkspace().copy(fromPath, destPath);
        }
    }

    /**
     *
     */
    public void save() {
        if (session.isLive()) {
            try {
                session.save();
            } catch (RepositoryException e) {
                logger.warn(e.getMessage());
            }
        }
    }

    /**
     * @param out
     * @throws RepositoryException
     * @throws IOException
     */
    public void exportXML(OutputStream out) throws RepositoryException, IOException {
        // Export /wegas/GM_<ID>/files/ to out
        session.exportSystemView(this.getNode("/").getPath(), out, false, false);
    }

    /**
     * @param input
     * @throws RepositoryException
     * @throws IOException
     */
    public void importXML(InputStream input) throws RepositoryException, IOException {
        try {
            this.deleteRoot();                                              // Remove nodes first
            session.save();
            session.getWorkspace().importXML(WFSConfig.GM_ROOT.apply(gameModelId), input, ImportUUIDBehavior.IMPORT_UUID_COLLISION_REPLACE_EXISTING);
            session.save();
        } catch (RepositoryException | IOException ex) {
            logger.error("File repository import failed", ex);
            throw ex;
        }
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

    protected Boolean isRoot(Node node) throws RepositoryException {
        return node.getPath().equals(this.workspaceRoot);
    }

    protected String getWorkspacePath(Node node) throws RepositoryException {
        final Pattern pattern = Pattern.compile("^" + this.workspaceRoot);
        final Matcher matcher = pattern.matcher(node.getPath());
        return matcher.replaceFirst("");
    }

    @Override
    public void close() {
        this.save();
        SessionManager.closeSession(session);
    }
}
