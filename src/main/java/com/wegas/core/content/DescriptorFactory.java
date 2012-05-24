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

import java.util.logging.Level;
import java.util.logging.Logger;
import javax.jcr.Node;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class DescriptorFactory {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(DescriptorFactory.class);

    public static AbstractContentDescriptor getDescriptor(Node node, ContentConnector contentConnector) {
        AbstractContentDescriptor abstractContentDescriptor = null;
        String nodePath = null;
        String mimeType = null;

        try {
            nodePath = node.getPath();
            if (nodePath.equals("/")) {
                return new DirectoryDescriptor(nodePath, contentConnector);     //Root Node
            }
            mimeType = node.getProperty(WFSConfig.WFS_MIME_TYPE).getString();
            abstractContentDescriptor =
                    DirectoryDescriptor.MIME_TYPE.equals(mimeType)
                    ? new DirectoryDescriptor(nodePath, contentConnector)
                    : new FileDescriptor(nodePath, mimeType, node.getProperty(WFSConfig.WFS_LAST_MODIFIED).getString(), node.getProperty(WFSConfig.WFS_DATA).getBinary().getSize(), contentConnector);
        } catch (RepositoryException ex) {
            logger.error("WFS: node error (path:{}, type:{})", nodePath, mimeType);
        }
        return abstractContentDescriptor;
    }

    public static AbstractContentDescriptor getDescriptor(String absolutePath, ContentConnector contentConnector) throws RepositoryException {
        AbstractContentDescriptor abstractContentDescriptor = new AbstractContentDescriptor(absolutePath, contentConnector) {

            @Override
            public void getContentFromRepository() throws RepositoryException {
                throw new UnsupportedOperationException("Not supported yet.");
            }

            @Override
            public void saveToRepository() throws RepositoryException {
                throw new UnsupportedOperationException("Not supported yet.");
            }

            @Override
            public void setContentToRepository() throws RepositoryException {
                throw new UnsupportedOperationException("Not supported yet.");
            }
        };
        Node node;

        node = contentConnector.getNode(abstractContentDescriptor.fileSystemAbsolutePath);
        if (node == null) {
            return new DirectoryDescriptor(absolutePath, contentConnector);     //return a directory (inexistant)
        }
        return getDescriptor(node, contentConnector);
    }
}
