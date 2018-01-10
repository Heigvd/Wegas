/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import java.util.ArrayList;
import java.util.List;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class DirectoryDescriptor extends AbstractContentDescriptor {

    /**
     * Directory mime-type
     */
    public static final String MIME_TYPE = "application/wfs-directory";

    @JsonIgnore
    @WegasEntityProperty(includeByDefault = false)
    private List<AbstractContentDescriptor> children;

    /**
     *
     * @param absolutePath
     * @param contentConnector
     */
    public DirectoryDescriptor(String absolutePath, ContentConnector contentConnector) {
        super(absolutePath, contentConnector);
        this.mimeType = MIME_TYPE;
    }

    /**
     *
     * @param name
     * @param path
     * @param contentConnector
     */
    public DirectoryDescriptor(String name, String path, ContentConnector contentConnector) {
        super(name, path, contentConnector);
        this.mimeType = MIME_TYPE;
    }

    /**
     *
     * @return true if the directory stands at /
     */
    @JsonIgnore
    public boolean isRootDirectory() {
        return this.fileSystemAbsolutePath.equals("/");
    }

    /**
     *
     * @return ????? sum of bytes of children ???
     */
    @JsonProperty("bytes")
    @Override
    public Long getBytes() {
        List<AbstractContentDescriptor> nodes = new ArrayList<>();
        try {
            nodes = this.list();
        } catch (RepositoryException ex) {
        }
        Long sum = 0L;
        for (AbstractContentDescriptor n : nodes) {
            sum += n.getBytes();
        }
        return sum;
    }

    /**
     *
     * @return @throws RepositoryException
     */
    @JsonIgnore
    public List<AbstractContentDescriptor> list() throws RepositoryException {
        NodeIterator nodeIterator = this.connector.listChildren(this.fileSystemAbsolutePath);
        List<AbstractContentDescriptor> files = new ArrayList<>();
        while (nodeIterator.hasNext()) {
            files.add(DescriptorFactory.getDescriptor(nodeIterator.nextNode(), this.connector));
        }
        return files;
    }

    @JsonIgnore
    public List<AbstractContentDescriptor> getChildren() throws RepositoryException {
        return this.list();
    }

    public void setChildren(List<AbstractContentDescriptor> children) {
    }
}
