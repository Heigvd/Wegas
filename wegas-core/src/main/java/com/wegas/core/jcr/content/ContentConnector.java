/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.wegas.core.jcr.SessionHolder;
import java.io.*;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipOutputStream;
import javax.jcr.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.apache.commons.io.IOUtils;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ContentConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(ContentConnector.class);

    /**
     *
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
    private Session session;
    private String workspace = null;

    /**
     *
     * @param gameModelId
     * @throws RepositoryException
     */
    protected ContentConnector(Long gameModelId) throws RepositoryException {
        this.workspace = "GM_" + gameModelId;
        this.session = SessionHolder.getSession(this.workspace);
        this.initializeNamespaces();

    }

    /**
     *
     * @throws RepositoryException
     */
    protected ContentConnector() throws RepositoryException {
        this.session = SessionHolder.getSession(null);
        this.initializeNamespaces();
    }

    /**
     *
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
     *
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected boolean nodeExist(String absolutePath) throws RepositoryException {
        return session.nodeExists(absolutePath);
    }

    /**
     *
     * @param absolutePath
     * @throws RepositoryException
     */
    protected void deleteFile(String absolutePath) throws RepositoryException {
        this.getNode(absolutePath).remove();
        session.save();
    }

    /**
     *
     * @param path
     * @return
     * @throws PathNotFoundException
     * @throws RepositoryException
     */
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

    /**
     *
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected InputStream getData(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_DATA).getBinary().getStream();
    }

    /**
     *
     * @param absolutePath
     * @return
     * @throws RepositoryException
     * @throws IOException
     */
    protected byte[] getBytesData(String absolutePath) throws RepositoryException, IOException {
        return IOUtils.toByteArray(this.getData(absolutePath));
    }

    /**
     *
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
     *
     * @param absolutePath
     * @return
     * @throws RepositoryException
     */
    protected String getMimeType(String absolutePath) throws RepositoryException {
        return this.getProperty(absolutePath, WFSConfig.WFS_MIME_TYPE).getString();
    }

    /**
     *
     * @param absolutePath
     * @param mimeType
     * @throws RepositoryException
     */
    protected void setMimeType(String absolutePath, String mimeType) throws RepositoryException {
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_MIME_TYPE, mimeType);
    }

    /**
     *
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
     *
     * @param absolutePath
     * @param note
     * @throws RepositoryException
     */
    protected void setNote(String absolutePath, String note) throws RepositoryException {
        note = note == null ? "" : note;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_NOTE, note);
    }

    /**
     *
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
     *
     * @param absolutePath
     * @param description
     * @throws RepositoryException
     */
    protected void setDescription(String absolutePath, String description) throws RepositoryException {
        description = description == null ? "" : description;
        this.getNode(absolutePath).setProperty(WFSConfig.WFS_DESCRIPTION, description);

    }

    /**
     *
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
     * @param out a ZipOutputStream to write files to
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
        for (Iterator<AbstractContentDescriptor> it = list.iterator(); it.hasNext();) {
            AbstractContentDescriptor item = it.next();
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
        SessionHolder.closeSession(workspace);
        Session s = SessionHolder.getSession(null);
        try {
            s.getWorkspace().deleteWorkspace(name);
        } catch (UnsupportedRepositoryOperationException ex) {
            logger.warn("UnsupportedRepositoryOperationException : fallback to clear workspace. Further : improve to remove workspace");
            session = SessionHolder.getSession(workspace);
            this.clearWorkspace();
            SessionHolder.closeSession(workspace);
        }
    }

    /**
     *
     * @param oldGameModelId
     * @throws RepositoryException
     */
    public void cloneWorkspace(Long oldGameModelId) throws RepositoryException {
        ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(oldGameModelId);
        NodeIterator it = connector.listChildren("/");
        String path;
        while (it.hasNext()) {
            path = it.nextNode().getPath();
            session.getWorkspace().clone("GM_" + oldGameModelId, path, path, true);
        }
        session.save();
    }

    /**
     *
     * @throws RepositoryException
     */
    public void clearWorkspace() throws RepositoryException {
        NodeIterator it = this.listChildren("/");
        while (it.hasNext()) {
            it.nextNode().remove();
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
     *
     * @param out
     * @throws RepositoryException
     * @throws IOException
     * @throws SAXException
     */
    public void exportXML(OutputStream out) throws RepositoryException, IOException, SAXException {

        XMLSerializer handler = new XMLSerializer(out);
        NodeIterator it = this.listChildren("/");
        handler.startDocument();
        handler.startElement("", "", "root", null);
        while (it.hasNext()) {
            session.exportSystemView(it.nextNode().getPath(), handler, false, false);
        }
        handler.endElement("", "", "root");
        handler.endDocument();

    }

    /**
     *
     * @param input
     * @throws IOException
     * @throws SAXException
     * @throws ParserConfigurationException
     * @throws TransformerException
     * @throws RepositoryException
     */
    public void importXML(InputStream input) throws IOException, SAXException, ParserConfigurationException, TransformerException, RepositoryException {
        try {
            DocumentBuilderFactory bf = DocumentBuilderFactory.newInstance();
            bf.setIgnoringElementContentWhitespace(true);
            DocumentBuilder rootBuilder = bf.newDocumentBuilder();
            Document root = rootBuilder.parse(input);
            NodeList list = root.getFirstChild().getChildNodes();
            this.clearWorkspace();                                              // Remove nodes first
            for (Integer i = 0; i < list.getLength(); i++) {
                if (list.item(i).getNodeName().equals("sv:node")) {
                    Document node = bf.newDocumentBuilder().newDocument();
                    node.appendChild(node.importNode(list.item(i), true));
                    DOMSource source = new DOMSource(node);
                    StringWriter writer = new StringWriter();
                    StreamResult result = new StreamResult(writer);
                    TransformerFactory.newInstance().newTransformer().transform(source, result);
                    try (InputStream nodeAsStream = new ByteArrayInputStream(writer.getBuffer().toString().getBytes())) {
                        session.getWorkspace().importXML("/", nodeAsStream, ImportUUIDBehavior.IMPORT_UUID_COLLISION_REMOVE_EXISTING);
                    }
                }
            }
        } finally {
            input.close();
        }
    }

    /**
     * Check for custom namespaces and register them if they don't exist
     *
     * @throws RepositoryException
     */
    private void initializeNamespaces()
            throws RepositoryException {
        for (String prefix : WFSConfig.namespaces.keySet()) {
            try {
                session.getWorkspace().getNamespaceRegistry().getURI(prefix);
            } catch (NamespaceException e) {
                session.getWorkspace().getNamespaceRegistry().registerNamespace(prefix, WFSConfig.namespaces.get(prefix));
            }
        }
    }
}
