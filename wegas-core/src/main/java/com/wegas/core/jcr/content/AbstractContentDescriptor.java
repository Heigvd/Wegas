/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.Helper;
import com.wegas.core.jcr.tools.JCRDescriptorCallback;
import com.wegas.core.jcr.tools.JCRDescriptorFactory;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.view.StringView;
import com.wegas.editor.view.VisibilitySelectView;
import java.io.Serializable;
import java.util.zip.ZipEntry;
import javax.jcr.ItemExistsException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@WegasEntity(factory = JCRDescriptorFactory.class, callback = JCRDescriptorCallback.class)
abstract public class AbstractContentDescriptor implements ModelScoped, Mergeable, Serializable {

    private static final long serialVersionUID = 7654657575516817326L;

    @JsonIgnore
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(AbstractContentDescriptor.class);

    /**
     * @param name
     * @param path
     * @param mimeType
     *
     * @return
     *
     * @throws RepositoryException
     */
    @JsonCreator
    public static AbstractContentDescriptor getDescriptor(@JsonProperty("name") String name,
        @JsonProperty("path") String path,
        @JsonProperty("mimeType") String mimeType) throws RepositoryException {
        if (mimeType.equals(DirectoryDescriptor.MIME_TYPE)) {
            return new DirectoryDescriptor(name, path, null);
        } else {
            return new FileDescriptor(name, path, null);
        }
    }

    @JsonIgnore
    private boolean synched = false;
    /**
     * MIME type
     */
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(
            label = "MIME type",
            readOnly = true,
            value = StringView.class
        )
    )
    protected String mimeType;

    /**
     * node name
     */
    private String name;

    /**
     *
     */
    private String path;

    /**
     * Some internal comment
     */
    @WegasEntityProperty(view = @View(label = "Note"),
        optional = false, nullable = false, proposal = EmptyString.class)
    private String note = "";

    /**
     * Some public comment
     */
    @WegasEntityProperty(view = @View(label = "Description"),
        optional = false, nullable = false, proposal = EmptyString.class)
    private String description = "";

    /**
     * The so-called visibility
     */
    @WegasEntityProperty(protectionLevel = ProtectionLevel.ALL,
        nullable = false,
        view = @View(label = "", value = VisibilitySelectView.class))
    private Visibility visibility = Visibility.PRIVATE;
    /**
     *
     */
    @JsonIgnore
    protected String fileSystemAbsolutePath;
    /**
     *
     */
    @JsonIgnore
    private ContentConnector connector;

    /**
     * @param absolutePath
     * @param contentConnector
     */
    protected AbstractContentDescriptor(String absolutePath, ContentConnector contentConnector) {
        this.connector = contentConnector;
        this.parseAbsolutePath(absolutePath);
        this.buildNamespaceAbsolutePath();
    }

    /**
     * @param absolutePath
     * @param contentConnector
     * @param mimeType
     */
    protected AbstractContentDescriptor(String absolutePath, ContentConnector contentConnector, String mimeType) {
        this(absolutePath, contentConnector);
        this.mimeType = mimeType;
    }

    /**
     * @param name
     * @param path
     * @param contentConnector
     */
    protected AbstractContentDescriptor(String name, String path, ContentConnector contentConnector) {
        if (Helper.isNullOrEmpty(path)){
            this.path = "/";
        } else {
            this.path = path.charAt(0) == '/' ? path : "/" + path;
        }
        this.connector = contentConnector;
        this.name = name;
        this.path = path;
        this.buildNamespaceAbsolutePath();
    }

    /**
     * @param mimeType
     * @param name
     * @param path
     * @param contentConnector
     */
    protected AbstractContentDescriptor(String mimeType, String name, String path, ContentConnector contentConnector) {
        this(name, path, contentConnector);

        this.mimeType = mimeType;
    }

    @JsonIgnore
    public ContentConnector.WorkspaceType getWorkspaceType() throws RepositoryException {
        return this.getConnector().getWorkspaceType();
    }

    @JsonIgnore
    protected ContentConnector getConnector() throws RepositoryException {
        if (this.connector != null) {
            return connector;
        } else {
            throw new RepositoryException("No Connector available");
        }
    }

    @WegasExtraProperty(
        nullable = false,
        view = @View(
            label = "RefID",
            readOnly = true,
            value = StringView.class,
            index = -800
        )
    )
    @Override
    //@JsonIgnore
    public String getRefId() {
        return this.getFullPath() + "::" + this.getClass().getSimpleName();
    }

    @Override
    //@JsonIgnore
    public void setRefId(String refId) {
        // unmodifiable refId
    }

    /**
     * @return true is this is a directory
     */
    @JsonIgnore
    public Boolean isDirectory() {
        return this.mimeType.equals(DirectoryDescriptor.MIME_TYPE);
    }

    /**
     * @return the MIME type
     */
    public String getMimeType() {
        return mimeType;
    }

    /**
     * @return the name
     */
    @WegasExtraProperty(view = @View(label = "Filename"),
        nullable = false, optional = false)
    public String getName() {
        return name;
    }

    /**
     * @param mimeType
     */
    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
        try {
            getConnector().setMimeType(fileSystemAbsolutePath, mimeType);
        } catch (RepositoryException ex) {
            logger.error("Failed to set MIME-type of {}", fileSystemAbsolutePath);
        }
    }

    /**
     * @return path
     */
    @WegasExtraProperty(view = @View(label = "Path"), optional = false, nullable = false)
    public String getPath() {
        return path;
    }

    /**
     * @return full path
     */
    @JsonIgnore
    public String getFullPath() {
        String p = fileSystemAbsolutePath;
        if (this.isDirectory() && !p.endsWith("/")) {
            p += "/";
        }
        return p;
    }

    /**
     * @return note
     */
    public String getNote() {
        return note;
    }

    /**
     * @param note
     */
    public void setNote(String note) {
        this.note = note == null ? "" : note;
        try {
            getConnector().setNote(fileSystemAbsolutePath, this.note);
        } catch (RepositoryException ex) {
            logger.error("Failed to set note of {}", fileSystemAbsolutePath);
        }
    }

    /**
     * @return description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description
     */
    public void setDescription(String description) {
        this.description = description == null ? "" : description;
        try {
            getConnector().setDescription(fileSystemAbsolutePath, this.description);
        } catch (RepositoryException ex) {
            logger.error("Failed to set description of {}", fileSystemAbsolutePath);
        }
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public Visibility getVisibility() {
        return visibility;
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
        try {
            getConnector().setVisibility(fileSystemAbsolutePath, this.visibility.toString());
        } catch (RepositoryException ex) {
            logger.error("Failed to set visibility of {}", fileSystemAbsolutePath);
        }
    }

    /**
     * @return true if is synched
     */
    @JsonIgnore
    public boolean isSynched() {
        return synched;
    }

    /**
     * @return true if node exists
     *
     * @throws RepositoryException
     */
    @JsonIgnore
    public boolean exist() throws RepositoryException {
        if (connector != null) {
            return connector.nodeExist(fileSystemAbsolutePath);
        } else {
            return false;
        }
    }

    /**
     * @return true is this has children
     *
     * @throws RepositoryException
     */
    @JsonIgnore
    public boolean hasChildren() throws RepositoryException {
        return getConnector().getNode(fileSystemAbsolutePath).hasNodes();
    }

    /**
     * @throws RepositoryException
     */
    public void sync() throws RepositoryException {
        if (this.exist()) {                                                     //check existence then load it else create it
            try {
                this.loadContentFromRepository();
            } catch (NullPointerException e) { // NOPMD TODO: check NPE before, but we do not know what to check
                if (!this.fileSystemAbsolutePath.equals("/")) {                 //Not a rootNode
                    throw e;
                }
            }
            synched = true;
        } else {
            this.saveToRepository();
            this.saveContentToRepository();
            synched = true;
        }
    }

    /**
     * @param file
     *
     * @return the child
     *
     * @throws RepositoryException
     */
    @JsonIgnore
    public AbstractContentDescriptor addChild(AbstractContentDescriptor file) throws RepositoryException {
        Node parent = getConnector().getNode(fileSystemAbsolutePath);
        parent.addNode(file.getName());
        file.saveContentToRepository();
        return file;
    }

    /**
     * @return node size
     */
    @WegasExtraProperty(view = @View(label = "File size"), optional = false, nullable = false)
    public Long getBytes() {
        return 0L;
    }

    /**
     * @param force
     *
     * @throws RepositoryException
     */
    @JsonIgnore
    public void delete(boolean force) throws RepositoryException {
        if (this.exist()) {
            if (!this.hasChildren() || force) {
                getConnector().deleteNode(fileSystemAbsolutePath);
            } else {
                throw new ItemExistsException("Save the children ! Preventing collateral damage !");
            }
        }
    }

    /**
     * @throws RepositoryException
     */
    @JsonIgnore
    public void loadContentFromRepository() throws RepositoryException {
        ContentConnector myConnector = getConnector();
        this.mimeType = myConnector.getMimeType(fileSystemAbsolutePath);
        this.note = myConnector.getNote(fileSystemAbsolutePath);
        this.description = myConnector.getDescription(fileSystemAbsolutePath);
        Visibility visib;
        try {
            visib = Visibility.valueOf(myConnector.getVisibility(fileSystemAbsolutePath));
        } catch (IllegalArgumentException ex) {
            visib = Visibility.PRIVATE;
        }
        this.visibility = visib;
    }

    /**
     * @throws RepositoryException
     */
    @JsonIgnore
    public void saveContentToRepository() throws RepositoryException {
        ContentConnector myConnector = getConnector();

        myConnector.setMimeType(fileSystemAbsolutePath, mimeType);
        myConnector.setNote(fileSystemAbsolutePath, note);
        myConnector.setDescription(fileSystemAbsolutePath, description);
        myConnector.setVisibility(fileSystemAbsolutePath, visibility.toString());
        //connector.save();
    }

    /**
     * @throws RepositoryException
     */
    @JsonIgnore
    public void saveToRepository() throws RepositoryException {
        String parentPath = this.getPath();
        AbstractContentDescriptor parent = DescriptorFactory.getDescriptor(parentPath, getConnector());
        parent.addChild(this);
    }

    /**
     * @return
     */
    @JsonIgnore
    protected ZipEntry getZipEntry() {
        String fullPath = this.getFullPath();
        if (!fullPath.isEmpty() && fullPath.charAt(0) == '/') { // ZIP entry shouldn't be absolute.
            fullPath = fullPath.replaceFirst("/", "");
        }
        return new ZipEntry(fullPath);
    }

    /**
     * Convert an absolute path to path and name
     *
     * @param absolutePath
     */
    @JsonIgnore
    private void parseAbsolutePath(String absolutePath) {
//        absolutePath = absolutePath.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
        if (absolutePath.isEmpty() || absolutePath.charAt(0) != '/') {
            absolutePath = "/" + absolutePath;
        }
        if (absolutePath.equals("/")) {
            this.name = "";
            this.path = "/";
        } else {
            String[] dirs = absolutePath.split("/");
            this.name = dirs[dirs.length - 1];
            this.path = "/";

            for (int i = 1; i < dirs.length - 1; i++) {
                this.path += dirs[i];
                this.path += i < dirs.length - 2 ? "/" : "";
            }
        }
    }

    /**
     * Convert name and path to a fileSystemAbsolutePath
     */
    @JsonIgnore
    private void buildNamespaceAbsolutePath() {
        if (this.path.equals("/")) {
            this.fileSystemAbsolutePath = "/" + this.name;
        } else {
            this.fileSystemAbsolutePath = this.path
                + (this.path.endsWith("/") ? "" : "/")
                + this.name;
        }
    }

    @Override
    public String toString() {
        return "AbstractContentDescriptor{" + "mimeType=" + mimeType + ", name=" + name + ", path=" + path + ", fsAbsPath=" + fileSystemAbsolutePath + ", note=" + note + ", desc=" + description + "}";
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return this.connector.getGameModel().belongsToProtectedGameModel();
    }

    @Override
    public Mergeable getMergeableParent() {
        try {
            if (path.equals("/") && Helper.isNullOrEmpty(name)) {
                return this.connector.getGameModel();
            } else {
                AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path, connector);
                return descriptor;
            }
        } catch (RepositoryException ex) {
            return this.connector.getGameModel();
        }
    }

    @Override
    public Visibility getInheritedVisibility() {
        try {
            AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor(path, connector);
            return descriptor.getVisibility();
        } catch (RepositoryException ex) {
            return Visibility.INHERITED;
        }
    }
}
