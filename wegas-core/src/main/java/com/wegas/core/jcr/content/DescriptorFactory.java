/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import javax.jcr.Node;
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
                mimeType = node.getProperty(WFSConfig.WFS_MIME_TYPE).getString();
                switch (mimeType) {
                    case DirectoryDescriptor.MIME_TYPE:
                        abstractContentDescriptor = new DirectoryDescriptor(nodePath, contentConnector);
                        break;
                    default:
                        abstractContentDescriptor = new FileDescriptor(nodePath, mimeType, node.getProperty(WFSConfig.WFS_LAST_MODIFIED).getDate(), node.getProperty(WFSConfig.WFS_DATA).getBinary().getSize(), contentConnector);
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
        AbstractContentDescriptor abstractContentDescriptor = new AbstractContentDescriptor(absolutePath, contentConnector) {
        };
        Node node;

        node = contentConnector.getNode(abstractContentDescriptor.fileSystemAbsolutePath);
        if (node == null) {
            return new DirectoryDescriptor(absolutePath, contentConnector);     //return a directory (inexistant)
        }
        return getDescriptor(node, contentConnector);
    }
}
