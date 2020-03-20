/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import java.util.Calendar;
import java.util.GregorianCalendar;
import javax.jcr.Node;
import javax.jcr.PathNotFoundException;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class DescriptorFactory {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(DescriptorFactory.class);

    /**
     * @param node
     * @param contentConnector
     *
     * @return
     */
    public static AbstractContentDescriptor getDescriptor(Node node, ContentConnector contentConnector) {
        AbstractContentDescriptor abstractContentDescriptor = null;
        String nodePath = null;
        String mimeType = null;
        try {
            nodePath = contentConnector.getWorkspacePath(node);
            if (contentConnector.isRoot(node)) {
                abstractContentDescriptor = new DirectoryDescriptor("/", contentConnector);     //Root Node
            } else {
                try {
                    Property mimeTypeProperty = node.getProperty(WFSConfig.WFS_MIME_TYPE);
                    if (mimeTypeProperty != null) {
                        mimeType = mimeTypeProperty.getString();
                    }
                } catch (RepositoryException ex) {
                    mimeType = "application/octet-stream";
                }
                switch (mimeType) {
                    case DirectoryDescriptor.MIME_TYPE:
                        abstractContentDescriptor = new DirectoryDescriptor(nodePath, contentConnector);
                        break;
                    default:
                        Calendar date;
                        try {
                            Property dateProperty = node.getProperty(WFSConfig.WFS_LAST_MODIFIED);
                            date = dateProperty.getDate();
                        } catch (RepositoryException ex) {
                            date = new GregorianCalendar(1970, 1, 1, 0, 0);
                        }
                        long size = 0l;
                        try {
                            Property lengthProperty = node.getProperty(WFSConfig.WFS_DATA);
                            if (lengthProperty != null) {
                                size = lengthProperty.getBinary().getSize();
                            }
                        } catch (RepositoryException ex) {
                        }

                        abstractContentDescriptor = new FileDescriptor(nodePath, mimeType, date, size, contentConnector);
                }
            }
            if (abstractContentDescriptor.exist()) {
                abstractContentDescriptor.getContentFromRepository();
            }
        } catch (RepositoryException ex) {
            logger.error("WFS: node error (path:{}, type:{})", nodePath, mimeType);
        }
        return abstractContentDescriptor;
    }

    /**
     * @param absolutePath
     * @param contentConnector
     *
     * @return
     *
     * @throws RepositoryException
     */
    public static AbstractContentDescriptor getDescriptor(String absolutePath, ContentConnector contentConnector) throws RepositoryException {
        Node node;
        try {
            node = contentConnector.getNode(absolutePath);
        } catch (PathNotFoundException ex) {
            return new DirectoryDescriptor(absolutePath, contentConnector);     //return a directory (inexistant)
        }
        return getDescriptor(node, contentConnector);
    }
}
