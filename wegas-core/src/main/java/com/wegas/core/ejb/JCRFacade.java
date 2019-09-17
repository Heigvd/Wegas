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
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.ItemExistsException;
import javax.jcr.LoginException;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.ws.rs.core.Response;
import org.apache.jackrabbit.oak.namepath.impl.NamePathMapperImpl;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence
 */
@Stateless
@LocalBean
public class JCRFacade {

    @Inject JCRConnectorProvider jCRConnectorProvider;

    @Inject
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    //private static final String FILENAME_REGEXP = "^(?:[\\p{L}[0-9]-_ ]|\\.)+$";
    private static final String[] FORBIDDEN_CHARS = {"?", "\\", "/", "]", "[", "*", "|", "¦", "#", ";", ":", "\""};
    /**
     *
     */
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(JCRFacade.class);

    /**
     * @param gameModel
     * @param workspaceType
     * @param absolutePath
     * @param force
     *
     * @return the destroyed element or HTTP not modified
     *
     * @throws WegasErrorMessage when deleting a non empty directory without
     *                           force=true
     */
    public Object delete(GameModel gameModel,
            WorkspaceType workspaceType,
            String absolutePath,
            String force) {

        final Boolean recursive = !force.equals("");
        logger.debug("Asking delete for node ({}), force {}", absolutePath, recursive);
        try {
            ContentConnector connector = this.getContentConnector(gameModel, workspaceType);
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(absolutePath, connector);
            if (descriptor.exist()) {
                if (!descriptor.belongsToProtectedGameModel() || descriptor.getVisibility() == ModelScoped.Visibility.PRIVATE) {
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
                    return Response.status(403).build();
                }
            } else {
                return Response.notModified("Path" + absolutePath + " does not exist").build();
            }
        } catch (RepositoryException ex) {
            logger.error("Really what append here ??", ex);
        }
        return null;
    }

    /**
     * @param gameModel
     * @param workspaceType
     * @param directory
     *
     * @return list of directory content
     */
    public List<AbstractContentDescriptor> listDirectory(GameModel gameModel,
            WorkspaceType workspaceType,
            String directory) {
        logger.debug("Asking listing for directory (/{})", directory);

        try {
            ContentConnector connector = jCRConnectorProvider.getContentConnector(gameModel, workspaceType);
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
     * @param gameModel
     * @param workspaceType
     * @param directory
     *
     * @return list of directory content and its subdirectories recursively
     */
    public List<AbstractContentDescriptor> recurseListDirectory(GameModel gameModel,
            WorkspaceType workspaceType,
            String directory) {

        List<AbstractContentDescriptor> recurseList = new ArrayList<>();
        List<AbstractContentDescriptor> childrenList = listDirectory(gameModel, workspaceType, directory);
        if (childrenList != null) {
            for (AbstractContentDescriptor children : childrenList) {
                // We assume here that the directories are always listed first
                recurseList.add(children);
                if (children.isDirectory()) {
                    recurseList.addAll(
                            this.recurseListDirectory(gameModel,
                                    workspaceType,
                                    children.getFullPath()));
                }
            }

        }

        return recurseList;
    }

    public FileDescriptor createFile(Long gameModelId, WorkspaceType wType, String name, String path, String mediaType,
            String note, String description, InputStream file, final Boolean override) throws RepositoryException {
        return this.createFile(gameModelFacade.find(gameModelId), wType, name, path, mediaType, note, description, file, override);
    }

    private boolean isPathAvailable(GameModel gameModel, WorkspaceType wType, String path, String name) throws RepositoryException {
        if (gameModel.isModel()) {
            for (GameModel scen : gameModelFacade.getImplementations(gameModel)) {
                ContentConnector connector = jCRConnectorProvider.getContentConnector(scen, wType);
                AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path + "/" + name, connector);
                if (descriptor.exist()) {
                    return false;
                }
            }
            return true;
        } else if (gameModel.isScenarioBasedOnModel()) {
            // Path should not exists in the model
            GameModel model = gameModel.getBasedOn();
            ContentConnector contentConnector = jCRConnectorProvider.getContentConnector(model, wType);
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path + "/" + name, contentConnector);

            return !descriptor.exist();
        } else {
            return true;
        }
    }

    private void assertFilenameIsValid(String filename) {
        List<String> errors = new LinkedList<String>();

        // rewrite with a powerfil regex
        for (String c : FORBIDDEN_CHARS) {
            if (filename.contains(c)) {
                errors.add(c);
            }
        }

        if (!errors.isEmpty()) {
            StringBuilder sb = new StringBuilder("Filename ").append(filename).append(" is not valid! Character");
            if (errors.size() > 1) {
                sb.append("s");
            }
            for (int i = errors.size() - 1; i >= 0; i--) {
                sb.append(" ").append(errors.get(i));
                if (i > 1) {
                    sb.append(",");
                } else if (i == 1){
                    sb.append(" and");
                }
            }
            sb.append(errors.size() > 1 ? " are" : " is").append(" forbidden!");

            throw WegasErrorMessage.error(sb.toString());
        }
    }

    /**
     * @param gameModel
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
    public FileDescriptor createFile(GameModel gameModel, WorkspaceType wType, String name, String path, String mediaType,
            String note, String description, InputStream file, final Boolean override) throws RepositoryException {

        logger.debug("File name: {}", name);

        assertFilenameIsValid(name);

        try {
            ContentConnector connector = jCRConnectorProvider.getContentConnector(gameModel, wType);

            AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);

            if (!dir.belongsToProtectedGameModel() || dir.getVisibility() != ModelScoped.Visibility.INTERNAL) {
                FileDescriptor detachedFile = new FileDescriptor(name, path, connector);

                if (!detachedFile.exist()) {
                    // new file, set visibility to private
                    detachedFile.setVisibility(gameModel.isModel() ? ModelScoped.Visibility.INHERITED : ModelScoped.Visibility.PRIVATE);
                    if (!isPathAvailable(gameModel, wType, path, name)) {
                        throw WegasErrorMessage.error(detachedFile.getPath() + name + " already exists in the model cluster");
                    }
                    // check name
                }

                if (!detachedFile.exist() || override) { //Node should not exist
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
            } else {
                throw WegasErrorMessage.error("Path " + path + "is readonly");
            }
        } catch (RepositoryException ex) {
            ex.printStackTrace();
            throw ex;
        }
    }

    /**
     *
     * @param gameModelId
     * @param wType
     * @param name
     * @param path
     * @param note
     * @param description
     *
     * @return
     *
     * @throws RepositoryException
     */
    public DirectoryDescriptor createDirectory(Long gameModelId, WorkspaceType wType, String name, String path, String note, String description) throws RepositoryException {
        return this.createDirectory(gameModelFacade.find(gameModelId), wType, name, path, note, description);
    }

    /**
     * @param gameModel
     * @param wType
     * @param name
     * @param path
     * @param note
     * @param description
     *
     * @return the new directory
     *
     * @throws RepositoryException
     */
    public DirectoryDescriptor createDirectory(GameModel gameModel, WorkspaceType wType, String name, String path, String note, String description) throws RepositoryException {

        NamePathMapperImpl npm;
        //logger.debug("Directory name: {}", name);
        assertFilenameIsValid(name);

        ContentConnector connector = this.getContentConnector(gameModel, wType);

        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        if (dir.exist()) {
            if (!dir.belongsToProtectedGameModel() || dir.getVisibility() != ModelScoped.Visibility.INTERNAL) {

                if (isPathAvailable(gameModel, wType, path, name)) {
                    DirectoryDescriptor detachedFile = new DirectoryDescriptor(name, path, connector);

                    if (!detachedFile.exist()) {
                        detachedFile.setNote(note == null ? "" : note);
                        detachedFile.setDescription(description);
                        detachedFile.sync();
                        logger.info("Directory {} created at {}", detachedFile.getName(), detachedFile.getPath());
                        return detachedFile;
                    } else {
                        throw WegasErrorMessage.error(detachedFile.getPath() + name + " already exists");
                    }
                } else {
                    throw WegasErrorMessage.error(path + "/" + name + " already exists in the model cluster");
                }
            } else {
                throw WegasErrorMessage.error("Path " + path + "is readonly");
            }
        } else {
            throw WegasErrorMessage.error(path + " directory does not exists");
        }
    }

    /**
     * @param gameModel
     * @param wType
     * @param path
     *
     * @return true if the directory exists
     *
     * @throws RepositoryException
     */
    public boolean directoryExists(GameModel gameModel, WorkspaceType wType, String path) throws RepositoryException {
        ContentConnector connector = this.getContentConnector(gameModel, wType);
        AbstractContentDescriptor dir = DescriptorFactory.getDescriptor(path, connector);
        return dir.exist();
    }

    /**
     *
     * @param gameModelId
     * @param wType
     * @param path
     *
     * @return
     */
    public InputStream getFile(Long gameModelId, WorkspaceType wType, String path) {
        return this.getFile(gameModelFacade.find(gameModelId), wType, path);
    }

    /**
     * @param gameModel
     * @param wType
     * @param path
     *
     * @return the file content
     *
     * @throws WegasErrorMessage when the requested file doesn't exists
     */
    public InputStream getFile(GameModel gameModel, WorkspaceType wType, String path) {
        logger.debug("Asking file (/{})", path);

        InputStream ret = null;
        AbstractContentDescriptor fileDescriptor = null;
        ContentConnector connector = null;
        try {
            connector = this.getContentConnector(gameModel, wType);
            fileDescriptor = DescriptorFactory.getDescriptor(path, connector);
        } catch (PathNotFoundException e) {
            logger.debug("Asked path does not exist: {}", e.getMessage());
            throw WegasErrorMessage.error("Directory " + path + " doest not exist");
        } catch (RepositoryException e) {
            logger.error("Need to check those errors", e);
        }
        if (fileDescriptor instanceof FileDescriptor) {
            ret = new BufferedInputStream(((FileDescriptor) fileDescriptor).getBase64Data(), 512);
        }
        return ret;
    }

    /**
     *
     * @param gameModelId
     * @param wType
     * @param path
     *
     * @return
     *
     * @throws IOException
     */
    public byte[] getFileBytes(Long gameModelId, WorkspaceType wType, String path) throws IOException {
        return this.getFileBytes(gameModelFacade.find(gameModelId), wType, path);
    }

    /**
     * @param gameModel
     * @param wType
     * @param path
     *
     * @return the file content
     *
     * @throws java.io.IOException
     *
     * @throws WegasErrorMessage   when the requested file doesn't exists
     */
    public byte[] getFileBytes(GameModel gameModel, WorkspaceType wType, String path) throws IOException {
        logger.debug("Asking file bytes (/{})", path);

        try {
            ContentConnector connector = this.getContentConnector(gameModel, wType);
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

    private ContentConnector getContentConnector(GameModel gameModel, WorkspaceType workspaceType) throws RepositoryException {
        return jCRConnectorProvider.getContentConnector(gameModel, workspaceType);
    }

}
