/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.wegas.core.jcr.SessionHolder;
import org.apache.commons.io.IOUtils;
import org.slf4j.LoggerFactory;
import org.xml.sax.SAXException;

import javax.jcr.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Calendar;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipOutputStream;

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ContentConnector implements AutoCloseable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(ContentConnector.class);

    static final private String EXPORT_NODE_NAME = "exportedFiles";

    final private Session session;

    private String workspace = null;

    /**
     * @param bytes
     * @return
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

    /**
     * @param gameModelId
     * @throws RepositoryException
     */
    protected ContentConnector(Long gameModelId) throws RepositoryException {
        this.workspace = "GM_" + gameModelId;
        this.session = SessionHolder.getSession(this.workspace);
        this.initializeNamespaces();

    }

    /**
     * @throws RepositoryException
     */
    protected ContentConnector() throws RepositoryException {
        this.session = SessionHolder.getSession(null);
        this.initializeNamespaces();
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected Node getNode(String absolutePath) throws RepositoryException {
        try {
            return session.getNode(absolutePath);
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
        return session.nodeExists(absolutePath);
    }

    /**
     * @param absolutePath
     * @throws RepositoryException
     */
    protected void deleteFile(String absolutePath) throws RepositoryException {
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
    protected Boolean isPrivate(String absolutePath) throws RepositoryException {
        try {
            return this.getProperty(absolutePath, WFSConfig.WFS_PRIVATE).getBoolean();
        } catch (NullPointerException ex) {
            return false;
        }
    }

    /**
     * @param absolutePath
     * @param priv
     * @throws RepositoryException
     */
    protected void setPrivate(String absolutePath, Boolean priv) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_PRIVATE, priv);
    }

    /**
     * Check the entire path for a private property set to true
     *
     * @param absolutePath
     * @return
     */
    protected Boolean isInheritedPrivate(String absolutePath) {
        Boolean ret = false;
        Node node;
        try {
            node = this.getNode(absolutePath);
            while (!ret && !isRoot(node)) {
                try {
                    ret = node.getProperty(WFSConfig.WFS_PRIVATE).getBoolean();
                } catch (PathNotFoundException e) {
                    ret = false;
                }
                node = node.getParent();
            }
            ret = ret || (node.hasProperty(WFSConfig.WFS_PRIVATE) && node.getProperty(WFSConfig.WFS_PRIVATE).getBoolean());
        } catch (RepositoryException | NullPointerException ex) {
            return false;
        }
        return ret;
    }

    /**
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected Calendar getLastModified(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_LAST_MODIFIED).getDate();
    }

    /*
     * Return content Bytes size
     */

    /**
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
     * Jackrabbit doesn't handle workspace deletetion, falling back to remove
     * all undelying nodes
     *
     * @throws RepositoryException
     */
    public void deleteWorkspace() throws RepositoryException {
        //throw new UnsupportedOperationException("Jackrabbit: There is currently no programmatic way to delete workspaces. You can delete a workspace by manually removing the workspace directory when the repository instance is not running.");
        String name = session.getWorkspace().getName();
        Session adminSession = SessionHolder.getSession(null);
        try {
            adminSession.getWorkspace().deleteWorkspace(name);
        } catch (UnsupportedRepositoryOperationException ex) {
            logger.warn("UnsupportedRepositoryOperationException : fallback to clear workspace.");
            this.clearWorkspace();
        } finally {
            SessionHolder.closeSession(adminSession);
        }
    }

    /**
     * @param oldGameModelId
     * @throws RepositoryException
     */
    public void cloneWorkspace(Long oldGameModelId) throws RepositoryException {
        try (ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(oldGameModelId)) {
            NodeIterator it = connector.listChildren("/");

            String path;
            while (it.hasNext()) {
                path = it.nextNode().getPath();
                session.getWorkspace().clone("GM_" + oldGameModelId, path, path, true);
            }
            PropertyIterator propertyIterator = connector.getNode("/").getProperties(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + "*");
            Property prop;
            while (propertyIterator.hasNext()) {
                prop = propertyIterator.nextProperty();
                session.getRootNode().setProperty(prop.getName(), prop.getValue());
            }
            session.save();
        }
    }

    /**
     * @throws RepositoryException
     */
    public void clearWorkspace() throws RepositoryException {
        NodeIterator it = session.getRootNode().getNodes("*");
        while (it.hasNext()) {
            Node node = it.nextNode();
            if (!(node.getName().equals("jcr:system") || node.getName().equals("rep:policy"))) {
                node.remove();
            }
        }
        PropertyIterator properties = session.getRootNode().getProperties();
        while (properties.hasNext()) {
            Property property = properties.nextProperty();
            if (!(property.getName().startsWith("jcr:") || property.getName().startsWith("rep:") || property.getName().startsWith("sling:"))) {
                property.remove();
            }
        }
        this.save();
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
     * @throws SAXException
     */
    public void exportXML(OutputStream out) throws RepositoryException, IOException {
        final NodeIterator nodeIterator = this.listChildren("/");
        final Node exportNode = session.getRootNode().addNode(EXPORT_NODE_NAME);
        while (nodeIterator.hasNext()) {
            Node n = nodeIterator.nextNode();
            session.move(n.getPath(), exportNode.getPath() + "/" + n.getName());
        }
        session.exportSystemView(exportNode.getPath(), out, false, false);
        session.refresh(false); // Discard change.
    }

    /**
     * @param input
     * @throws RepositoryException
     * @throws IOException
     */
    public void importXML(InputStream input) throws RepositoryException, IOException {
        try {
            this.clearWorkspace();                                              // Remove nodes first
            final Node rootNode = session.getRootNode();
            session.save();
            session.getWorkspace().importXML("/", input, ImportUUIDBehavior.IMPORT_UUID_COLLISION_THROW);
            final NodeIterator nodes = rootNode.getNode(EXPORT_NODE_NAME).getNodes("wfs:*");
            while (nodes.hasNext()) {
                final Node node = nodes.nextNode();
                session.getWorkspace().move(node.getPath(), "/" + node.getName());
            }
            rootNode.getNode(EXPORT_NODE_NAME).remove();
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

    private static Boolean isRoot(Node node) throws RepositoryException {
        try {
            node.getParent();
        } catch (ItemNotFoundException ex) {
            return true;
        }
        return false;
    }

    @Override
    public void close() {
        this.save();
        SessionHolder.closeSession(session);

    }
}
