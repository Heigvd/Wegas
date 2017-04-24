/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.LoggerFactory;

import javax.jcr.ItemExistsException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import java.util.zip.ZipEntry;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
//@XmlRootElement
abstract public class AbstractContentDescriptor {

    //@XmlTransient
    @JsonIgnore
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(AbstractContentDescriptor.class);

    /**
     * @param name
     * @param path
     * @param mimeType
     * @return
     * @throws RepositoryException
     */
    @JsonCreator
    public static AbstractContentDescriptor getDescriptor(@JsonProperty("name") String name, @JsonProperty("path") String path, @JsonProperty("mimeType") String mimeType) throws RepositoryException {
        if (mimeType.equals(DirectoryDescriptor.MIME_TYPE)) {
            return new DirectoryDescriptor(name, path, null);
        } else {
            return new FileDescriptor(name, path, null);
        }
    }

    //@XmlTransient
    @JsonIgnore
    private boolean synched = false;
    /**
     *
     */
    protected String mimeType;
    private String name;
    private String path;
    private String note = "";
    private String description = "";
    /**
     *
     */
    //@XmlTransient
    @JsonIgnore
    protected String fileSystemAbsolutePath;
    /**
     *
     */
    ////@XmlTransient
    @JsonIgnore
    protected ContentConnector connector;

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
        path = path.startsWith("/") ? path : "/" + path;
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

    /**
     * @return true is this is a directory
     */
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
    public String getName() {
        return name;
    }

    /**
     * @param mimeType
     */
    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    /**
     * @return path
     */
    public String getPath() {
        return path;
    }

    /**
     * @return full path
     */
    //@XmlTransient
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
    }

    /**
     * @return true if is synched
     */
    //@XmlTransient
    @JsonIgnore
    public boolean isSynched() {
        return synched;
    }

    /**
     * @return truc if node exists
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public boolean exist() throws RepositoryException {
        return connector.nodeExist(fileSystemAbsolutePath);
    }

    /**
     * @return true is this has children
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public boolean hasChildren() throws RepositoryException {
        return connector.getNode(fileSystemAbsolutePath).hasNodes();
    }

    /**
     * @throws RepositoryException
     */
    public void sync() throws RepositoryException {
        if (this.exist()) {                                                     //check existence then load it else create it
            try {
                this.getContentFromRepository();
            } catch (NullPointerException e) {
                if (!this.fileSystemAbsolutePath.equals("/")) {                 //Not a rootNode
                    throw e;
                }
            }
            synched = true;
        } else {
            this.saveToRepository();
            this.setContentToRepository();
            synched = true;
        }
    }

    /**
     * @param file
     * @return the child
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public AbstractContentDescriptor addChild(AbstractContentDescriptor file) throws RepositoryException {
        Node parent = connector.getNode(fileSystemAbsolutePath);
        parent.addNode(file.getName());
        file.setContentToRepository();
        return file;
    }

    /**
     * @return node size
     */
    public Long getBytes() {
        return 0L;
    }

    /**
     * @param force
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public void delete(boolean force) throws RepositoryException {
        if (this.exist()) {
            if (!this.hasChildren() || force) {
                connector.deleteNode(fileSystemAbsolutePath);
            } else {
                throw new ItemExistsException("Save the children ! Preventing collateral damage !");
            }
        }
    }

    /**
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public void getContentFromRepository() throws RepositoryException {
        this.mimeType = connector.getMimeType(fileSystemAbsolutePath);
        this.note = connector.getNote(fileSystemAbsolutePath);
        this.description = connector.getDescription(fileSystemAbsolutePath);
    }

    /**
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public void setContentToRepository() throws RepositoryException {
        connector.setMimeType(fileSystemAbsolutePath, mimeType);
        connector.setNote(fileSystemAbsolutePath, note);
        connector.setDescription(fileSystemAbsolutePath, description);
        connector.save();
    }

    /**
     * @throws RepositoryException
     */
    //@XmlTransient
    @JsonIgnore
    public void saveToRepository() throws RepositoryException {
        String parentPath = this.getPath();
        AbstractContentDescriptor parent = DescriptorFactory.getDescriptor(parentPath, connector);
        parent.addChild(this);
    }

    /**
     * @return
     */
    @JsonIgnore
    protected ZipEntry getZipEntry() {
        String fullPath = this.getFullPath();
        if (fullPath.startsWith("/")) { // ZIP entry shouldn't be absolute.
            fullPath = fullPath.replaceFirst("/", "");
        }
        return new ZipEntry(fullPath);
    }

    /**
     * Convert an absolute path to path and name
     *
     * @param absolutePath
     */
    //@XmlTransient
    @JsonIgnore
    private void parseAbsolutePath(String absolutePath) {
//        absolutePath = absolutePath.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
        if (!absolutePath.startsWith("/")) {
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
    //@XmlTransient
    @JsonIgnore
    private void buildNamespaceAbsolutePath() {
        if (this.path.equals("/")) {
            this.fileSystemAbsolutePath = "/" + this.name;
        } else {
            this.fileSystemAbsolutePath = this.path + "/" + this.name;
        }
    }

    @Override
    public String toString() {
        return "AbstractContentDescriptor{" + "mimeType=" + mimeType + ", name=" + name + ", path=" + path + ", fileSystemAbsolutePath=" + fileSystemAbsolutePath + ", note=" + note + ", description=" + description + "}";
    }
}
