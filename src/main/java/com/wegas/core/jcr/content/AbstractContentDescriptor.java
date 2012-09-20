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
package com.wegas.core.jcr.content;

import java.io.Serializable;
import javax.jcr.ItemExistsException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonCreator;
import org.codehaus.jackson.annotate.JsonProperty;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
abstract public class AbstractContentDescriptor implements Serializable {

    @XmlTransient
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(AbstractContentDescriptor.class);
    @XmlTransient
    private boolean synched = false;
    protected String mimeType;
    private String name;
    private String path;
    private String note = "";
    private String description = "";
    @XmlTransient
    protected String fileSystemAbsolutePath;
    @XmlTransient
    protected ContentConnector connector;

    protected AbstractContentDescriptor(String absolutePath, ContentConnector contentConnector) {
        this.connector = contentConnector;
        this.parseAbsolutePath(absolutePath);
        this.buildNamespaceAbsolutePath();
    }

    protected AbstractContentDescriptor(String absolutePath, ContentConnector contentConnector, String mimeType) {
        this(absolutePath, contentConnector);
        this.mimeType = mimeType;
    }

    protected AbstractContentDescriptor(String name, String path, ContentConnector contentConnector) {
        path = path.startsWith("/") ? path : "/" + path;
        this.connector = contentConnector;
        this.name = name.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
        this.path = path.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
        this.buildNamespaceAbsolutePath();
    }

    protected AbstractContentDescriptor(String mimeType, String name, String path, ContentConnector contentConnector) {
        this(name, path, contentConnector);
        this.mimeType = mimeType;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getName() {
        return name;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public void setName(String name) {
        this.name = name.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
        this.buildNamespaceAbsolutePath();
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
        this.buildNamespaceAbsolutePath();
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note == null ? "" : note;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description == null ? "" : description;
    }

    @XmlTransient
    public boolean isSynched() {
        return synched;
    }

    @XmlTransient
    public boolean exist() throws RepositoryException {
        return connector.nodeExist(fileSystemAbsolutePath);
    }

    @XmlTransient
    public boolean hasChildren() throws RepositoryException {
        return connector.getNode(fileSystemAbsolutePath).hasNodes();
    }

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

    @XmlTransient
    public AbstractContentDescriptor addChild(AbstractContentDescriptor file) throws RepositoryException {
        Node parent = connector.getNode(fileSystemAbsolutePath);
        parent.addNode(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + file.getName());
        file.setContentToRepository();
        return file;
    }

    @XmlTransient
    public void delete(boolean force) throws RepositoryException {
        if (this.exist()) {
            if (!this.hasChildren() || force) {
                connector.deleteFile(fileSystemAbsolutePath);
            } else {
                throw new ItemExistsException("Save the children ! Preventing collateral damage !");
            }
        }
    }

    @XmlTransient
    public void getContentFromRepository() throws RepositoryException {
        this.mimeType = connector.getMimeType(fileSystemAbsolutePath);
        this.note = connector.getNote(fileSystemAbsolutePath);
        this.description = connector.getDescription(fileSystemAbsolutePath);
    }

    @XmlTransient
    public void setContentToRepository() throws RepositoryException {
        connector.setMimeType(fileSystemAbsolutePath, mimeType);
        connector.setNote(fileSystemAbsolutePath, note);
        connector.setDescription(fileSystemAbsolutePath, description);
        connector.save();
    }

    @XmlTransient
    public void saveToRepository() throws RepositoryException {
        String parentPath = this.getPath().replaceAll("/(\\w)", "/" + WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + "$1");
        AbstractContentDescriptor parent = DescriptorFactory.getDescriptor(parentPath, connector);
        parent.sync();
        parent.addChild(this);
    }

    /**
     * Convert an absolute path (with or without WFS namespace) to path and name
     * without namespace.
     *
     * @param absolutePath
     */
    @XmlTransient
    private void parseAbsolutePath(String absolutePath) {
        absolutePath = absolutePath.replaceAll(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX, "");
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
     * Convert name and path to a fileSystemAbsolutePath, including namespace
     * (wfs)
     */
    @XmlTransient
    private void buildNamespaceAbsolutePath() {
        if (this.path.equals("/")) {
            this.fileSystemAbsolutePath = "/" + (this.name.equals("") ? "" : WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + this.name);
        } else {
            this.fileSystemAbsolutePath = this.path.replaceAll("/(\\w)", "/" + WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + "$1") + (this.name.equals("") ? "" : "/" + WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + this.name);
        }
    }

    @Override
    public String toString() {
        return "AbstractContentDescriptor{" + "mimeType=" + mimeType + ", name=" + name + ", path=" + path + ", fileSystemAbsolutePath=" + fileSystemAbsolutePath + ", note=" + note + ", description=" + description + "}";
    }

    @JsonCreator
    public static AbstractContentDescriptor getDescriptor(@JsonProperty("name") String name, @JsonProperty("path") String path, @JsonProperty("mimeType") String mimeType) throws RepositoryException {
        if (mimeType.equals(DirectoryDescriptor.MIME_TYPE)) {
            return new DirectoryDescriptor(name, path, null);
        } else {
            return new FileDescriptor(name, path, null);
        }
    }
}
