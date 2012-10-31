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
package com.wegas.core.jcr.content;

import com.wegas.core.jcr.SessionHolder;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Calendar;
import javax.jcr.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.sax.SAXSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import org.dom4j.dom.DOMDocument;
import org.dom4j.io.SAXContentHandler;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.Attributes;
import org.xml.sax.ContentHandler;
import org.xml.sax.DTDHandler;
import org.xml.sax.EntityResolver;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.AttributesImpl;
import org.xml.sax.helpers.DefaultHandler;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ContentConnector {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(ContentConnector.class);
    private Session session;
    private String workspace = null;

    protected ContentConnector(Long gameModelId) throws RepositoryException {
        this.workspace = "GM_" + gameModelId;
        this.session = SessionHolder.getSession(this.workspace);
        this.initializeNamespaces();

    }

    protected ContentConnector() throws RepositoryException {
        this.session = SessionHolder.getSession(null);
        this.initializeNamespaces();
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

    public void clearWorkspace() throws RepositoryException {
        NodeIterator it = this.listChildren("/");
        while (it.hasNext()) {
            it.nextNode().remove();
        }
        this.save();
    }

    public void save() {
        if (session.isLive()) {
            try {
                session.save();
            } catch (RepositoryException e) {
                logger.warn(e.getMessage());
            }
        }
    }

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

    public void importXML(InputStream input)
            throws IOException, SAXException, ParserConfigurationException,
            TransformerException, RepositoryException {
        try {
            DocumentBuilder rootBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document root = rootBuilder.parse(input);
            NodeList list = root.getFirstChild().getChildNodes();
            for (Integer i = 0; i < list.getLength(); i++) {
                Document node = DocumentBuilderFactory.newInstance().newDocumentBuilder().newDocument();
                logger.info("Node {}", list.item(i).getNodeName());
                node.appendChild(node.importNode(list.item(i), true));
                DOMSource source = new DOMSource(node);
                StringWriter writer = new StringWriter();
                StreamResult result = new StreamResult(writer);
                TransformerFactory.newInstance().newTransformer().transform(source, result);
                InputStream nodeAsStream = null;
                try {
                    nodeAsStream = new ByteArrayInputStream(writer.toString().getBytes());
                    session.getWorkspace().importXML("/", nodeAsStream, ImportUUIDBehavior.IMPORT_UUID_COLLISION_REMOVE_EXISTING);
                } finally {
                    if (nodeAsStream != null) {
                        nodeAsStream.close();
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
     * Some hijacking so that input and output are on the same stream. Transform
     * on itself.
     */
    public class XMLSerializer implements ContentHandler {

        final private TransformerFactory tf = TransformerFactory.newInstance();
        private ContentHandler ch;
        private Boolean started = false;

        public XMLSerializer(OutputStream os) throws SAXException {
            try {
                final Transformer t = tf.newTransformer();

                t.transform(new SAXSource(
                        new XMLReader() {
                            @Override
                            public ContentHandler getContentHandler() {
                                return ch;
                            }

                            @Override
                            public DTDHandler getDTDHandler() {
                                return null;
                            }

                            @Override
                            public EntityResolver getEntityResolver() {
                                return null;
                            }

                            @Override
                            public ErrorHandler getErrorHandler() {
                                return null;
                            }

                            @Override
                            public boolean getFeature(String name) {
                                return false;
                            }

                            @Override
                            public Object getProperty(String name) {
                                return null;
                            }

                            @Override
                            public void parse(InputSource input) {
                            }

                            @Override
                            public void parse(String systemId) {
                            }

                            @Override
                            public void setContentHandler(ContentHandler handler) {
                                ch = handler;
                            }

                            @Override
                            public void setDTDHandler(DTDHandler handler) {
                            }

                            @Override
                            public void setEntityResolver(EntityResolver resolver) {
                            }

                            @Override
                            public void setErrorHandler(ErrorHandler handler) {
                            }

                            @Override
                            public void setFeature(String name, boolean value) {
                            }

                            @Override
                            public void setProperty(String name, Object value) {
                            }
                        }, new InputSource()),
                        new StreamResult(os));
            } catch (TransformerException e) {
                throw new SAXException(e);
            }

            if (ch == null) {
                throw new SAXException("Transformer didn't set ContentHandler");
            }
        }

        @Override
        public void setDocumentLocator(Locator locator) {
            ch.setDocumentLocator(locator);
        }

        @Override
        public void startDocument() throws SAXException {
            if (!started) {                                                     //Document should only be started once.
                ch.startDocument();
                started = true;
            }
        }

        @Override
        public void endDocument() throws SAXException {
            ch.endDocument();
            started = false;
        }

        @Override
        public void startPrefixMapping(String prefix, String uri) throws SAXException {
            ch.startPrefixMapping(prefix, uri);
        }

        @Override
        public void endPrefixMapping(String prefix) throws SAXException {
            ch.endPrefixMapping(prefix);
        }

        @Override
        public void startElement(String uri, String localName, String qName, Attributes atts) throws SAXException {
            ch.startElement(uri, localName, qName, atts);
        }

        @Override
        public void endElement(String uri, String localName, String qName) throws SAXException {
            ch.endElement(uri, localName, qName);
        }

        @Override
        public void characters(char[] ch, int start, int length) throws SAXException {
            this.ch.characters(ch, start, length);
        }

        @Override
        public void ignorableWhitespace(char[] ch, int start, int length) throws SAXException {
            this.ch.ignorableWhitespace(ch, start, length);
        }

        @Override
        public void processingInstruction(String target, String data) throws SAXException {
            ch.processingInstruction(target, data);
        }

        @Override
        public void skippedEntity(String name) throws SAXException {
            ch.skippedEntity(name);
        }
    }
}
