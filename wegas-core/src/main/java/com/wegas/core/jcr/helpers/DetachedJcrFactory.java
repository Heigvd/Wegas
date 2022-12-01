/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.core.merge.utils.WegasFactory;
import com.wegas.core.persistence.game.GameModel;
import java.lang.reflect.InvocationTargetException;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * When a Wegas patch is applied on a Detached repository, creating some new node may occur. This
 * class provided a customize way to create such new nodes.
 * <p>
 * The main point is, if the detached repository is link to a real JCR repo, to keep a link between
 * the detached new node and its JCR-managed twin.
 *
 * @author maxence
 */
public class DetachedJcrFactory implements WegasFactory {

    private static final Logger logger = LoggerFactory.getLogger(DetachedJcrFactory.class);

    @Override
    public <T> T newInstance(GameModel gameModel, T originalObject) throws InstantiationException, IllegalAccessException, InvocationTargetException, NoSuchMethodException {

        try {
            ContentConnector connector = gameModel.getConnector(ContentConnector.WorkspaceType.FILES);

            if (originalObject instanceof DetachedFileDescriptor) {
                logger.debug("Create JCRFIle for {}", originalObject);
                String absolutePath = ((DetachedFileDescriptor) originalObject).getRefId();
                DetachedFileDescriptor newFile = new DetachedFileDescriptor();
                if (connector != null) {
                    FileDescriptor jcrFile = new FileDescriptor(absolutePath, connector);
                    if (!jcrFile.exist()) {
                        jcrFile.saveToRepository();
                    }
                    newFile.setJcrFile(jcrFile);
                }

                return (T) newFile;
            } else if (originalObject instanceof DetachedDirectoryDescriptor) {
                logger.debug("Create JCRDir for {}", originalObject);
                String absolutePath = ((DetachedDirectoryDescriptor) originalObject).getRefId();
                DetachedDirectoryDescriptor newDir = new DetachedDirectoryDescriptor();
                if (connector != null) {
                    DirectoryDescriptor jcrDir = new DirectoryDescriptor(absolutePath, connector);

                    if (!jcrDir.exist()) {
                        jcrDir.saveToRepository();
                    }
                    newDir.setJcrDirectory(jcrDir);
                }
                return (T) newDir;
            }
            return null;
        } catch (RepositoryException ex) {
            throw new InstantiationException("JCR Repository Exception -> " + ex.toString());
        }
    }

}
