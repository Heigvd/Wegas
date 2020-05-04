/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentComparator;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
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
import org.slf4j.LoggerFactory;

/**
 * @author Maxence
 */
@Stateless
@LocalBean
public class JCRFacade {

    @Inject
    JCRConnectorProvider jCRConnectorProvider;

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
     * @throws WegasErrorMessage when deleting a non empty directory without force=true
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
        String fullPath = path + (path.endsWith("/") ? "" : "/") + name;
        if (gameModel.isModel()) {
            for (GameModel scen : gameModelFacade.getImplementations(gameModel)) {
                ContentConnector connector = jCRConnectorProvider.getContentConnector(scen, wType);
                AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(fullPath, connector);
                if (descriptor.exist()) {
                    return false;
                }
            }
            return true;
        } else if (gameModel.isScenarioBasedOnModel()) {
            // Path should not exists in the model
            GameModel model = gameModel.getBasedOn();
            ContentConnector contentConnector = jCRConnectorProvider.getContentConnector(model, wType);
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(fullPath, contentConnector);

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
                } else if (i == 1) {
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
            if (dir.exist()) {

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
            } else {
                throw WegasErrorMessage.error("Path " + path + " does not exists");
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
     * Make sure the path exists. If not, create all missing directories. This is quite the
     * {@code mkdir -p} command.
     *
     *
     * @param gameModel workspace owner
     * @param wType     workspace type
     * @param path      path to create
     *
     * @return the innermost directory (just created or pre-existing)
     *
     * @throws RepositoryException
     */
    public DirectoryDescriptor createDirectoryWithParents(GameModel gameModel, WorkspaceType wType, String path) throws RepositoryException {

        ContentConnector connector = this.getContentConnector(gameModel, wType);

        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        String[] segments = path.split("/");

        DirectoryDescriptor dir = null;

        String p = "/";
        String name;
        for (int i = 1; i < segments.length; i++) {
            name = segments[i];

            dir = (DirectoryDescriptor) DescriptorFactory.getDescriptor(p + name, connector);
            if (!dir.exist()) {
                dir = this.createDirectory(gameModel, wType, name, p, "", "");
            }
            p += name + "/";
        }
        return dir;
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

    /**
     * Compare two file content. Do not take into account the filename, nor his children. To have
     * the same content, both file files must be of the same kind (files or directories).
     * <p>
     * By definition, all folders have the same content (as we do not care about children here).
     * Thus, this method always returns true when both source and target are directories.
     * <p>
     * To be equals, files must have the same {@link FileDescriptor#getData() content}
     * <p>
     * Any other case return false
     *
     * @param source first file or directory
     * @param target second file or directory
     *
     * @return true if both files have same content
     *
     * @throws IOException
     * @throws RepositoryException
     */
    private boolean fileContentsEquals(AbstractContentDescriptor source,
        AbstractContentDescriptor target) throws IOException, RepositoryException {
        if (source != null && source.exist()) {
            if (target != null && target.exist()) {
                if (source instanceof FileDescriptor
                    && target instanceof FileDescriptor) {
                    FileDescriptor srcFile = (FileDescriptor) source;
                    FileDescriptor tFile = (FileDescriptor) target;

                    FileDescriptor.FileContent srcData = srcFile.getData();
                    FileDescriptor.FileContent targetData = tFile.getData();

                    return srcData.equals(targetData);
                } else if (source instanceof DirectoryDescriptor
                    && target instanceof DirectoryDescriptor) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Collision proof file importer. This method will save a copy of the given file within the
     * target directory.
     * <p>
     * Collision-Proof algorithm:
     * <ol>
     * <li>In the case the file already exists in the repository:</li>
     * <ul>
     * <li>if both files have the same
     * {@link #fileContentsEquals(com.wegas.core.jcr.content.AbstractContentDescriptor, com.wegas.core.jcr.content.AbstractContentDescriptor) content},
     * the pre-existing file is kept and is used as the new one.</li>
     * <li>if both content differs, the file is suffixed with an increment and algorithm restarts at
     * point 1 </li>
     * </ul>
     * <li>If the file does not exists in the repository:</li>
     * <ul>
     * <li>create all missing directories in the repository</li>
     * <li>copy the file in the repository</li>
     * </ul>
     * </ol>
     *
     * @param file       to file to import
     * @param targetRepo the repository in which to save the copy
     *
     * @return the brand new copied file, maybe renamed, or the preexising file
     *
     * @throws RepositoryException if a problem occurred while accessing the repository database
     * @throws IOException
     */
    public AbstractContentDescriptor importFile(AbstractContentDescriptor file,
        ContentConnector targetRepo) throws RepositoryException, IOException {

        // find free path
        String path = file.getPath();

        if (!path.endsWith("/")) {
            path = path + "/";
        }

        String filename = file.getName(); //eg. "a.txt", "picture.jpg", "myFolder", ".hidden"
        String basename;
        String extension;

        int lastIndexOf = filename.lastIndexOf(".");
        if (lastIndexOf > 0) {
            basename = filename.substring(0, lastIndexOf); // eg picture, a
            extension = filename.substring(lastIndexOf); // eg. .jpg, .txt
        } else {
            basename = filename; // eg myFolder, .hidden
            extension = "";
        }

        AbstractContentDescriptor newItem;
        String fullPath;

        String suffixedName = basename;
        int suffix = 1;

        // find new filename
        do {
            fullPath = path + suffixedName + extension;

            suffix++;
            suffixedName = basename + "_" + suffix;

            newItem = DescriptorFactory.getDescriptor(
                fullPath, targetRepo);
            // loop as long as the fullPath points to a pre-existing file, unless
            // both pre-existing and new files have the same content
        } while (newItem.exist() && !fileContentsEquals(file, newItem));

        if (!newItem.exist()) {
            // create a copy
            this.createDirectoryWithParents(targetRepo.getGameModel(),
                WorkspaceType.FILES, path);

            if (file instanceof DirectoryDescriptor) {

                DirectoryDescriptor newDir = new DirectoryDescriptor(fullPath, targetRepo);
                newDir.setMimeType(file.getMimeType());
                newDir.setNote(file.getNote());
                newDir.setVisibility(file.getVisibility());
                newDir.setDescription(file.getDescription());
                newDir.sync();
                return newDir;
            } else if (file instanceof FileDescriptor) {
                FileDescriptor newFile = new FileDescriptor(fullPath, targetRepo);
                newFile.setMimeType(file.getMimeType());
                newFile.setNote(file.getNote());
                newFile.setVisibility(file.getVisibility());
                newFile.setDescription(file.getDescription());

                newFile.setDataLastModified(((FileDescriptor) file).getDataLastModified());
                newFile.sync();

                newFile.setData(((FileDescriptor) file).getData());
                return newFile;
            } else {
                throw WegasErrorMessage.error("Unknown file type");
            }
        } else {
            // use the pre-existing item as they have the same content
            return newItem;
        }
    }

    private ContentConnector getContentConnector(GameModel gameModel, WorkspaceType workspaceType) throws RepositoryException {
        return jCRConnectorProvider.getContentConnector(gameModel, workspaceType);
    }

}
