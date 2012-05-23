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
package com.wegas.core.content;

import java.io.Serializable;
import javax.jcr.ItemExistsException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
abstract public class AbstractContentDescriptor implements Serializable {

    @XmlTransient
    private boolean synched = false;
    protected String mimeType;
    private String name;
    private String path;
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
        this.connector = contentConnector;
        this.mimeType = mimeType;
        this.parseAbsolutePath(absolutePath);
        this.buildNamespaceAbsolutePath();
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
        if (this.exist()) {                                                     //check existence
            try {
                this.mimeType = connector.getMimeType(fileSystemAbsolutePath);
            } catch (NullPointerException e) {
                if (!this.fileSystemAbsolutePath.equals("/")) {                 //Not a rootNode
                    throw e;
                }
            }
            this.getContentFromRepository();
            synched = true;
        } else {
            this.saveToRepository();
            synched = true;
        }
    }

    @XmlTransient
    public AbstractContentDescriptor addChild(AbstractContentDescriptor file) throws RepositoryException {
        Node parent = connector.getNode(fileSystemAbsolutePath);
        parent.addNode(WFSConfig.WeGAS_FILE_SYSTEM_PREFIX + file.getName());
        connector.setMimeType(file.fileSystemAbsolutePath, file.getMimeType());
        file.setContentToRepository();
        return file;
    }

    @XmlTransient
    public void delete(boolean force) throws RepositoryException {
        if (this.exist()) {
            if (!this.hasChildren() || force) {
                connector.deleteFile(fileSystemAbsolutePath);
            }else{
                throw new ItemExistsException("Save the children ! Preventing collateral damage !");
            }
        }
    }

    @XmlTransient
    abstract public void getContentFromRepository() throws RepositoryException;

    @XmlTransient
    abstract public void setContentToRepository() throws RepositoryException;

    @XmlTransient
    abstract public void saveToRepository() throws RepositoryException;

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
        return "AbstractContentDescriptor{" + "mimeType=" + mimeType + ", name=" + name + ", path=" + path + ", fileSystemAbsolutePath=" + fileSystemAbsolutePath + '}';
    }
}
