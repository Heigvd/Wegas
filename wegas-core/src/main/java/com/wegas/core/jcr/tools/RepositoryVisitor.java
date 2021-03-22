/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.tools;

import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.jta.JCRConnectorProviderTx;
import com.wegas.core.persistence.game.GameModel;
import java.io.IOException;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public abstract class RepositoryVisitor {

    private static final Logger logger = LoggerFactory.getLogger(RepositoryVisitor.class);

    private void visitNode(AbstractContentDescriptor node) throws RepositoryException {
        this.visit(node);
        if (node instanceof DirectoryDescriptor) {
            DirectoryDescriptor directory = (DirectoryDescriptor) node;
            this.down();
            for (AbstractContentDescriptor child : directory.list()) {
                this.visitNode(child);
            }
            this.up();
        }
    }

    public void visitRepository(ContentConnector repository) throws RepositoryException {
        logger.trace("LS repo {}", repository.getWorkspaceRoot());
        visitNode(DescriptorFactory.getDescriptor("/", repository));
    }

    public void visitGameModelFiles(GameModel gameModel) throws RepositoryException {
        ContentConnector connector = null;
        try {
            connector = (ContentConnector) JCRConnectorProviderTx.getDetachedConnector(gameModel, JCRConnectorProvider.RepositoryType.FILES);
            this.visitRepository(connector);
        } finally {
            if (connector != null) {
                connector.rollback();
            }
        }
    }

    protected abstract void visit(AbstractContentDescriptor node);

    protected abstract void up();

    protected abstract void down();

    public static class ListRepository extends RepositoryVisitor {

        private int level = 0;

        private int bytesLimit;

        public ListRepository() {
            this(0);
        }

        /**
         * Display up to 'limit' bytes for file
         *
         * @param limit
         */
        public ListRepository(int limit) {
            this.bytesLimit = limit;
        }

        private void indent(StringBuilder sb) {
            for (int i = 0; i <= level; i++) {
                sb.append("  ");
            }
        }

        @Override
        public void visit(AbstractContentDescriptor node) {
            StringBuilder sb = new StringBuilder();
            indent(sb);
            sb.append(node.getName()).append(" (").append(node.getFullPath()).append(')');
            if (bytesLimit > 0 && node instanceof FileDescriptor) {
                FileDescriptor fd = (FileDescriptor) node;
                byte[] data;
                try {
                    data = fd.getData().getContent();

                    sb.append(System.lineSeparator());
                    indent(sb);
                    sb.append("Meta: ").append(fd.getDescription());
                    indent(sb);
                    sb.append("Content (first bytes only): ");

                    for (int i = 0; i < bytesLimit && i < data.length; i++) {
                        sb.append(data[i]).append(' ');
                    }
                } catch (IOException ex) {
                    logger.warn("Fails to read File {}", ex);
                }
            }
            logger.trace("{}", sb);
        }

        @Override
        public void up() {
            level--;
        }

        @Override
        public void down() {
            level++;
        }
    }
}
