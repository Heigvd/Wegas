/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.*;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.jcr.ItemExistsException;
import javax.jcr.LoginException;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.ws.rs.core.Response;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence
 */
@Stateless
@LocalBean
public class JCRFacade {

    /**
     *
     */
    private static final String FILENAME_REGEXP = "^(?:[\\p{L}[0-9]-_ ]|\\.)+$";

    /**
     *
     */
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(JCRFacade.class);

    /**
     * @param gameModelId
     * @param workspaceType
     * @param absolutePath
     * @param force
     *
     * @return the destroyed element or HTTP not modified
     *
     * @throws WegasErrorMessage when deleting a non empty directory without
     *                           force=true
     */
    public Object delete(Long gameModelId,
            WorkspaceType workspaceType,
            String absolutePath,
            String force) {

        final Boolean recursive = !force.equals("");
        logger.debug("Asking delete for node ({}), force {}", absolutePath, recursive);
        try (final ContentConnector connector = new ContentConnector(gameModelId, workspaceType)) {
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            if (descriptor.exist()) {
                descriptor.sync();
                if (descriptor instanceof DirectoryDescriptor && ((DirectoryDescriptor) descriptor).isRootDirectory()) {
                    return Response.notModified("Unable to erase Root Directory").build();
                }
                try {
                    descriptor.delete(recursive);
                } catch (ItemExistsException e) {
                    throw WegasErrorMessage.error(absolutePath + " is not empty, preventing removal");
                }
                return descriptor;
            } else {
                return Response.notModified("Path" + absolutePath + " does not exist").build();
            }
        } catch (RepositoryException ex) {
            logger.error("Really what append here ??", ex);
        }
        return null;
    }

    /**
     * @param gameModelId
     * @param workspaceType
     * @param directory
     *
     * @return list of directory content
     */
    public List<AbstractContentDescriptor> listDirectory(Long gameModelId,
            WorkspaceType workspaceType,
            String directory) {
        logger.debug("Asking listing for directory (/{})", directory);
        try (final ContentConnector connector = new ContentConnector(gameModelId, workspaceType)) {
            AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(directory, connector);
            if (!dir.exist() || dir instanceof FileDescriptor) {
                return null;
            } else if (dir instanceof DirectoryDescriptor) {
                List<AbstractContentDescriptor> ret = ((DirectoryDescriptor) dir).list();
                Collections.sort(ret, new ContentComparator());
                return ret;
            }
        } catch (LoginException ex) {
            logger.error(null, ex);
        } catch (RepositoryException ex) {
            logger.error(null, ex);
        }
        return new ArrayList<>();
    }

    /**
     * @param gameModelId
     * @param wType
     * @param name
     * @param path
     * @param mediaType
     * @param note
     * @param description
     * @param file
     * @param override
     *
     * @return new FileDescriptor
     *
     * @throws RepositoryException
     */
    public FileDescriptor createFile(Long gameModelId, WorkspaceType wType, String name, String path, String mediaType,
            String note, String description, InputStream file, final Boolean override) throws RepositoryException {

        logger.debug("File name: {}", name);

        Pattern pattern = Pattern.compile(FILENAME_REGEXP);
        Matcher matcher = pattern.matcher(name);
        if (name.equals("") || !matcher.matches()) {
            throw WegasErrorMessage.error(name + " is not a valid filename.  Letters, numbers, whitespace or \".-_\" only.");
        }
        try (final ContentConnector connector = this.getContentConnector(gameModelId, wType)) {

            AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
            FileDescriptor detachedFile = new FileDescriptor(name, path, connector);

            if (!detachedFile.exist() || override) {                                        //Node should not exist
                detachedFile.setNote(note == null ? "" : note);
                detachedFile.setDescription(description);
                //TODO : check allowed mime-types
                try {
                    detachedFile.setBase64Data(file, mediaType);
                    logger.info("{} ({}) uploaded", name, mediaType);
                    return detachedFile;
                } catch (IOException ex) {
                    logger.error("Error reading uploaded file :", ex);
                    throw WegasErrorMessage.error("Error reading uploaded file");
                }
            } else {
                throw WegasErrorMessage.error(detachedFile.getPath() + name + " already exists");
            }
        } catch (RepositoryException ex) {
            ex.printStackTrace();
            throw ex;
        }
    }

    /**
     * @param gameModelId
     * @param name
     * @param path
     * @param note
     * @param description
     *
     * @return the new directory
     *
     * @throws RepositoryException
     */
    public DirectoryDescriptor createDirectory(Long gameModelId, WorkspaceType wType, String name, String path, String note, String description) throws RepositoryException {

        //logger.debug("Directory name: {}", name);
        Pattern pattern = Pattern.compile(FILENAME_REGEXP);
        Matcher matcher = pattern.matcher(name);
        if (name.equals("") || !matcher.matches()) {
            throw WegasErrorMessage.error(name + " is not a valid filename.");
        }
        ContentConnector connector = this.getContentConnector(gameModelId, wType);
        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        if (dir.exist()) {                                                      // Directory has to exist
            DirectoryDescriptor detachedFile = new DirectoryDescriptor(name, path, connector);

            if (!detachedFile.exist()) {                                        // Node should not exist
                detachedFile.setNote(note == null ? "" : note);
                detachedFile.setDescription(description);
                detachedFile.sync();
                logger.info("Directory {} created at {}", detachedFile.getName(), detachedFile.getPath());
                return detachedFile;
            } else {
                throw WegasErrorMessage.error(detachedFile.getPath() + name + " already exists");
            }
        } else {
            throw WegasErrorMessage.error(path + " directory does not exist already exists");
        }
    }

    /**
     * @param gameModelId
     * @param wType
     * @param path
     *
     * @return true if the directory exists
     *
     * @throws RepositoryException
     */
    public boolean directoryExists(Long gameModelId, WorkspaceType wType, String path) throws RepositoryException {
        ContentConnector connector = this.getContentConnector(gameModelId, wType);
        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        return dir.exist();
    }

    /**
     * @param gameModelId
     * @param wType
     * @param path
     *
     * @return the file content
     *
     * @throws WegasErrorMessage when the requested file doesn't exists
     */
    public InputStream getFile(Long gameModelId, WorkspaceType wType, String path) {
        logger.debug("Asking file (/{})", path);

        InputStream ret = null;
        AbstractContentDescriptor fileDescriptor = null;
        ContentConnector connector = null;
        try {
            connector = this.getContentConnector(gameModelId, wType);
            fileDescriptor = DescriptorFactory.getDescriptor(path, connector);
        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());
            throw WegasErrorMessage.error("Directory " + path + " doest not exist");
        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
        }
        if (fileDescriptor instanceof FileDescriptor) {
            ret = new BufferedInputStream(((FileDescriptor) fileDescriptor).getBase64Data(), 512);
            connector.save();
        }
        return ret;
    }

    /**
     * @param gameModelId
     * @param wType
     * @param path
     *
     * @return the file content
     *
     * @throws java.io.IOException
     *
     * @throws WegasErrorMessage   when the requested file doesn't exists
     */
    public byte[] getFileBytes(Long gameModelId, WorkspaceType wType, String path) throws IOException {
        logger.debug("Asking file bytes (/{})", path);

        try {
            ContentConnector connector = this.getContentConnector(gameModelId, wType);
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path, connector);

            if (descriptor instanceof FileDescriptor) {
                return ((FileDescriptor) descriptor).getBytesData();
            }

        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());
            throw WegasErrorMessage.error("Directory " + path + " doest not exist");
        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
        }
        return new byte[]{};
    }

    private ContentConnector getContentConnector(long gameModelId, WorkspaceType wType) throws RepositoryException {
        return new ContentConnector(gameModelId, wType);
    }

}
