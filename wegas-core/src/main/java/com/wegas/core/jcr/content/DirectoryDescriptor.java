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
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.Mergeable;
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
    private static final long serialVersionUID = 1L;

    @JsonIgnore
    @WegasEntityProperty(includeByDefault = false, callback = ChildrenCallback.class, notSerialized = true)
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
        NodeIterator nodeIterator = this.getConnector().listChildren(this.fileSystemAbsolutePath);
        List<AbstractContentDescriptor> files = new ArrayList<>();
        while (nodeIterator.hasNext()) {
            files.add(DescriptorFactory.getDescriptor(nodeIterator.nextNode(), this.getConnector()));
        }
        return files;
    }

    /**
     * Get children from the repository
     *
     * @return
     *
     * @throws RepositoryException
     */
    @JsonIgnore
    public List<AbstractContentDescriptor> getChildren() throws RepositoryException {
        if (this.exist()) {
            return this.list();
        } else {
            // node not exists -> no children (avoid NPE)
            return new ArrayList<>();
        }
    }

    /**
     *
     * @param children
     */
    public void setChildren(List<AbstractContentDescriptor> children) {
        // no local store for children but WegasPatch requires a setter
    }

    /**
     * Children patch callback that remove the child from the workspace
     */
    public static class ChildrenCallback implements WegasCallback {

        /**
         * remove child from its parent node
         *
         * @param child      child to remove
         * @param container  parent
         * @param identifier child id
         *
         * @return refId of the removed child
         */
        @Override
        public Object remove(Object child, Mergeable container, Object identifier) {
            if (child instanceof AbstractContentDescriptor) {
                try {
                    AbstractContentDescriptor theChild = (AbstractContentDescriptor) child;

                    String refId = theChild.getRefId();
                    theChild.delete(false);
                    return refId;
                } catch (RepositoryException ex) {
                }
            }
            return null;
        }
    }
}
