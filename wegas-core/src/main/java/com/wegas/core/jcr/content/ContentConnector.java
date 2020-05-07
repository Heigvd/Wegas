/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.SessionManager;
import com.wegas.core.jcr.jta.JTARepositoryConnector;
import com.wegas.core.persistence.game.GameModel;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipOutputStream;
import javax.jcr.ImportUUIDBehavior;
import javax.jcr.NamespaceException;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.PathNotFoundException;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import org.apache.commons.io.IOUtils;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ContentConnector extends JTARepositoryConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(ContentConnector.class);

    private final GameModel gameModel;

    private final long gameModelId;

    private boolean managed;

    final private Session session;

    private String workspaceRoot;
    private final WorkspaceType workspaceType;

    public enum WorkspaceType {
        FILES,
        HISTORY
    }

    /**
     * @param bytes
     *
     * @return string representation
     */
    public static String bytesToHumanReadable(Long bytes) {
        Integer unit = 1024;
        if (bytes < unit) {
            return bytes + "B";
        }
        Integer exponent = (int) (Math.log(bytes) / Math.log(unit));
        char prefix = ("KMGTPE").charAt(exponent - 1);
        return String.format("%.1f%cB", bytes / Math.pow(unit, exponent), prefix);
    }

    /**
     * @param gameModel
     * @param workspaceType
     *
     * @throws RepositoryException
     */
    public ContentConnector(GameModel gameModel, WorkspaceType workspaceType) throws RepositoryException {
        this.gameModel = gameModel;
        this.gameModelId = gameModel.getId();
        this.workspaceType = workspaceType;

        if (workspaceType == WorkspaceType.FILES) {
            this.workspaceRoot = WFSConfig.WFS_ROOT.apply(gameModelId);
        } else if (workspaceType == WorkspaceType.FILES) {
            this.workspaceRoot = WFSConfig.HISTORY_ROOT.apply(gameModelId);
        }

        this.session = SessionManager.getSession();

        if (!this.session.nodeExists(this.workspaceRoot)) {
            logger.info("Initializing workspace {}", workspaceRoot);
            Node n = SessionManager.createPath(this.session, this.workspaceRoot);
            this.initializeNamespaces();
            n.setProperty(WFSConfig.WFS_MIME_TYPE, DirectoryDescriptor.MIME_TYPE);
            /*
             * DO not save manually anymore -> JTA Sychronisation will handle this automatically
             */
            //session.save(); // write it so that concurrent session may access it.
        }
    }

    @Override
    public void setManaged(boolean managed) {
        this.managed = managed;
    }

    @Override
    public boolean getManaged() {
        return this.managed;
    }

    public GameModel getGameModel() {
        return this.gameModel;
    }

    /**
     * @param absolutePath
     *
     * @return the node at absolutePath
     *
     * @throws RepositoryException
     */
    protected Node getNode(String absolutePath) throws RepositoryException {
        return session.getNode(this.workspaceRoot + absolutePath);
    }

    /**
     * @param absolutePath
     *
     * @return truc if there is a node at absolutePath
     *
     * @throws RepositoryException
     */
    protected boolean nodeExist(String absolutePath) throws RepositoryException {
        return session.nodeExists(this.workspaceRoot + absolutePath);
    }

    /**
     * @param absolutePath
     *
     * @throws RepositoryException
     */
    protected void deleteNode(String absolutePath) throws RepositoryException {
        this.getNode(absolutePath).remove();
        //session.save();
    }

    /**
     * @param path
     *
     * @return children iterator
     *
     * @throws PathNotFoundException
     * @throws RepositoryException
     */
    protected NodeIterator listChildren(String path) throws RepositoryException {
        return this.getNode(path).getNodes("*");
    }

    private String getPropertyAsString(String absolutePath, String propertyName, String defaultValue) throws RepositoryException {
        Property property = this.getProperty(absolutePath, propertyName);
        if (property != null) {
            return property.getString();
        } else {
            return defaultValue;
        }
    }

    /*
     * Property getters and setters
     */
    private Property getProperty(String absolutePath, String propertyName) throws RepositoryException {
        try {
            return this.getNode(absolutePath).getProperty(propertyName);
        } catch (PathNotFoundException ex) {
            logger.debug("Inexistant property ({}) on Node[{}]", propertyName, absolutePath);
        }
        return null;
    }

    public long getLength(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getSize();
    }

    protected InputStream getData(String absolutePath, long from, int len) throws RepositoryException, IOException {
        InputStream data = this.getData(absolutePath);
        byte[] bytes = new byte[len];
        long skip = data.skip(from);
        if (skip != from) {
            logger.error("Could not skip as much bytes...");
        }
        int read = data.read(bytes, 0, len);
        if (read < len) {
            return new ByteArrayInputStream(bytes, 0, read);
        } else {
            return new ByteArrayInputStream(bytes);
        }
    }

    /**
     * @param absolutePath
     *
     * @return child at absolutePath content
     *
     * @throws RepositoryException
     */
    protected InputStream getData(String absolutePath) throws RepositoryException {
        Property property = this.getProperty(absolutePath, WFSConfig.WFS_DATA);
        if (property != null) {
            return property.getBinary().getStream();
        } else {
            return new ByteArrayInputStream(new byte[0]);
        }
    }

    /**
     * @param absolutePath
     *
     * @return child at absolutePath content, as bytes
     *
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
     *
     * @return set child data
     *
     * @throws RepositoryException
     */
    protected Node setData(String absolutePath, String mimeType, InputStream data) throws RepositoryException {
        Node newNode = this.getNode(absolutePath);
        newNode.setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
        newNode.setProperty(WFSConfig.WFS_DATA, session.getValueFactory().createBinary(data));
        newNode.setProperty(WFSConfig.WFS_LAST_MODIFIED, Calendar.getInstance());
        //this.save();
        return newNode;
    }

    public void setLastModified(String absolutePath, Calendar date) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_LAST_MODIFIED, date);
    }

    public void setLastModified(String absolutePath) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_LAST_MODIFIED, Calendar.getInstance());
    }

    public void setData(String absolutePath, byte[] data) throws RepositoryException {
        Node newNode = this.getNode(absolutePath);
        InputStream input = new ByteArrayInputStream(data);
        newNode.setProperty(WFSConfig.WFS_DATA, this.session.getValueFactory().createBinary(input));
        //this.save();
    }

    /**
     * @param absolutePath
     *
     * @return get child mimetype
     *
     * @throws RepositoryException
     */
    protected String getMimeType(String absolutePath) throws RepositoryException {
        return this.getPropertyAsString(absolutePath, WFSConfig.WFS_MIME_TYPE, "application/octet-stream");
    }

    /**
     * @param absolutePath
     * @param mimeType
     *
     * @throws RepositoryException
     */
    protected void setMimeType(String absolutePath, String mimeType) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
    }

    /**
     * @param absolutePath
     *
     * @return child 'note'
     *
     * @throws RepositoryException
     */
    protected String getNote(String absolutePath) throws RepositoryException {
        return this.getPropertyAsString(absolutePath, WFSConfig.WFS_NOTE, "");
    }

    /**
     * @param absolutePath
     * @param note
     *
     * @throws RepositoryException
     */
    protected void setNote(String absolutePath, String note) throws RepositoryException {
        note = note == null ? "" : note;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_NOTE, note);
    }

    /**
     * @param absolutePath
     *
     * @return child descriptor
     *
     * @throws RepositoryException
     */
    protected String getDescription(String absolutePath) throws RepositoryException {
        return this.getPropertyAsString(absolutePath, WFSConfig.WFS_DESCRIPTION, "");
    }

    /**
     * @param absolutePath
     * @param description
     *
     * @throws RepositoryException
     */
    protected void setDescription(String absolutePath, String description) throws RepositoryException {
        description = description == null ? "" : description;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_DESCRIPTION, description);
    }

    /**
     * @param absolutePath
     *
     * @return child descriptor
     *
     * @throws RepositoryException
     */
    protected String getVisibility(String absolutePath) throws RepositoryException {
        return this.getPropertyAsString(absolutePath, WFSConfig.WFS_VISIBILITY, "PRIVATE");
    }

    /**
     * @param absolutePath
     * @param visibility
     *
     * @throws RepositoryException
     */
    protected void setVisibility(String absolutePath, String visibility) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_VISIBILITY, visibility == null ? "" : visibility);

    }

    /**
     * @param absolutePath
     *
     * @return child lastModified date
     *
     * @throws RepositoryException
     */
    protected Calendar getLastModified(String absolutePath) throws RepositoryException {
        Property property = this.getProperty(absolutePath, WFSConfig.WFS_LAST_MODIFIED);
        if (property != null) {
            return property.getDate();
        } else {
            return new GregorianCalendar(1970, 1, 1);
        }
    }

    /**
     * Return content Bytes size
     *
     * @param absolutePath
     *
     * @return child content size, in byte
     *
     * @throws RepositoryException
     */
    protected Long getBytesSize(String absolutePath) throws RepositoryException {
        Property p = this.getProperty(absolutePath, WFSConfig.WFS_DATA);
        if (p != null) {
            return p.getBinary().getSize();
        } else {
            return 0l;
        }
    }

    /**
     * Compress directory and children to ZipOutputStream. Warning: metadatas are not included due
     * to zip limitation
     *
     * @param out  a ZipOutputStream to write files to
     * @param path root path to compress
     *
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
     *
     */
    @Deprecated
    public void internalSave() {
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
     *
     * @throws RepositoryException
     * @throws IOException
     */
    public void exportXML(OutputStream out) throws RepositoryException, IOException {
        // Export /wegas/GM_<ID>/files/ to out
        session.exportSystemView(this.getNode("/").getPath(), out, false, false);
    }

    /**
     * @param input
     *
     * @throws RepositoryException
     * @throws IOException
     */
    public void importXML(InputStream input) throws RepositoryException, IOException {
        try {
            this.deleteRoot(); // Remove nodes first
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
        for (Map.Entry<String, String> entry : WFSConfig.namespaces.entrySet()) {
            String prefix = entry.getKey();
            String ns = entry.getValue();
            try {
                session.getWorkspace().getNamespaceRegistry().getURI(prefix);
            } catch (NamespaceException e) {
                session.getWorkspace().getNamespaceRegistry().registerNamespace(prefix, ns);
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

    public String getWorkspaceRoot() {
        return workspaceRoot;
    }

    @Override
    public void prepare() {
        try {
            session.getNode("/");
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
            logger.error("Content Commit FAILURE: {}", ex);
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

    public WorkspaceType getWorkspaceType() {
        return workspaceType;
    }

    @Override
    public String toString() {
        return "Content" + this.workspaceType + "(" + this.getWorkspaceRoot() + ")";
    }
}
