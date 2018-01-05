/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.tools;

import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.persistence.game.GameModel;
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
        logger.error("LS repo {}", repository.getWorkspaceRoot());
        visitNode(DescriptorFactory.getDescriptor("/", repository));
    }

    public void visitGameModelFiles(GameModel gameModel) throws RepositoryException {
        try (final ContentConnector repository = new ContentConnector(gameModel.getId(), ContentConnector.WorkspaceType.FILES)) {
            this.visitRepository(repository);
        }
    }

    protected abstract void visit(AbstractContentDescriptor node);

    protected abstract void up();

    protected abstract void down();

    public static class ListRepository extends RepositoryVisitor {

        private int level = 0;

        @Override
        public void visit(AbstractContentDescriptor node) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i <= level; i++) {
                sb.append("  ");
            }
            sb.append(node.getName()).append(" (").append(node.getFullPath()).append(")");
            logger.error(sb.toString());
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
