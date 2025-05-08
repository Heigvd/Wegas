/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.WegasCallback;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Callback to apply when patching detached repository. The point is to apply changes to the
 * effective persisted JCR repository too.
 *
 * @author maxence
 */
public class DetachedCb implements WegasCallback {

    private static final Logger logger = LoggerFactory.getLogger(DetachedCb.class);

    private void copyMeta(DetachedContentDescriptor detached, AbstractContentDescriptor jcr) {
        jcr.setDescription(detached.getDescription());
        jcr.setNote(detached.getNote());
        jcr.setMimeType(detached.getMimeType());
        jcr.setVisibility(detached.getVisibility());
    }

    @Override
    public void postUpdate(IMergeable entity, Object ref, Object identifier) {
        logger.debug("Post Update Enity: {}, ref: {}, id:{} ", entity, ref, identifier);
        if (entity instanceof DetachedFileDescriptor) {
            DetachedFileDescriptor file = (DetachedFileDescriptor) entity;
            FileDescriptor jcrFile = file.getJcrFile();
            if (jcrFile != null) {
                copyMeta(file, jcrFile);
                try {
                    jcrFile.setDataLastModified(file.getDataLastModified());
                    jcrFile.setData(file.getData());
                } catch (RepositoryException ex) {
                    logger.error("Failed to set data: {}", file);
                }
            }
        } else if (entity instanceof DetachedDirectoryDescriptor) {
            DetachedDirectoryDescriptor file = (DetachedDirectoryDescriptor) entity;
            DirectoryDescriptor jcrDirectory = file.getJcrDirectory();
            if (jcrDirectory != null) {
                copyMeta(file, jcrDirectory);
            }
        }
    }

    /*@Override
    public void persist(IMergeable entity, Object identifier) {
        logger.warn("Persist Entity: {}; id: {}", entity, identifier);
    }
    */

    @Override
    public void destroy(IMergeable entity, Object identifier) {
        logger.debug("Destroy Entity: {}; id: {}", entity, identifier);
        if (entity instanceof DetachedFileDescriptor) {
            DetachedFileDescriptor file = (DetachedFileDescriptor) entity;
            FileDescriptor jcrFile = file.getJcrFile();
            if (jcrFile != null) {
                try {
                    jcrFile.delete(true);
                } catch (RepositoryException ex) {
                    logger.error("Fail to delete file {}", file);
                }
            }
        } else if (entity instanceof DetachedDirectoryDescriptor) {
            DetachedDirectoryDescriptor file = (DetachedDirectoryDescriptor) entity;
            DirectoryDescriptor jcrDirectory = file.getJcrDirectory();
            if (jcrDirectory != null) {
                try {
                    jcrDirectory.delete(true);
                } catch (RepositoryException ex) {
                    logger.error("Fail to delete file {}", file);
                }
            }
        }
    }

}
