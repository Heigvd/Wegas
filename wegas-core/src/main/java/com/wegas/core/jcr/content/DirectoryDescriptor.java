/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class DirectoryDescriptor extends AbstractContentDescriptor {

    /**
     * Directory mime-type
     */
    public static final String MIME_TYPE = "application/wfs-directory";

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
     * @return
     */
    @JsonIgnore
    public boolean isRootDirectory() {
        return this.fileSystemAbsolutePath.equals("/");
    }

    /**
     *
     * @return
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
}
