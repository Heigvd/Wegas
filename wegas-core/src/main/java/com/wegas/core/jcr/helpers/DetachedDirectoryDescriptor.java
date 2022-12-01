/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import java.util.ArrayList;
import java.util.List;


/**
 * Represent a detached JCR directory.
 * "Detached" means this directory is a copy of the JCR one.
 *
 * @author maxence
 */
public class DetachedDirectoryDescriptor extends DetachedContentDescriptor {

    /**
     * Optional link to the corresponding JCR directory
     */
    private DirectoryDescriptor jcrDirectory = null;

    @WegasEntityProperty(order = 1000)
    private List<DetachedContentDescriptor> children = new ArrayList<>();

    public List<DetachedContentDescriptor> getChildren() {
        return children;
    }

    public void setChildren(List<DetachedContentDescriptor> children) {
        this.children = children;
    }

    public DirectoryDescriptor getJcrDirectory() {
        return jcrDirectory;
    }

    public void setJcrDirectory(DirectoryDescriptor jcrDirectory) {
        this.jcrDirectory = jcrDirectory;
    }

    @Override
    public String toString() {
        return "DetachedDirectoryDescriptor{" + "refId=" + getRefId() + '}';
    }

}
