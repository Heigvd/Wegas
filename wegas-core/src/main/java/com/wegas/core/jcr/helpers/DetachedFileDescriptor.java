/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.jcr.content.FileDescriptor;
import java.util.Calendar;

/**
 * Represent a detached JCR file.
 * "Detached" means this file is a copy of the JCR file.
 *
 * @author maxence
 */
public class DetachedFileDescriptor extends DetachedContentDescriptor {

    /**
     * Optional link to the corresponding JCR file
     */
    private FileDescriptor jcrFile = null;

    @WegasEntityProperty(notSerialized = true)
    private FileDescriptor.FileContent data;

    @WegasEntityProperty
    private Calendar dataLastModified;

    public Calendar getDataLastModified() {
        return dataLastModified;
    }

    public void setDataLastModified(Calendar date) {
        this.dataLastModified = date;
    }

    public FileDescriptor.FileContent getData() {
        return data;
    }

    public void setData(FileDescriptor.FileContent data) {
        this.data = data;
    }

    public FileDescriptor getJcrFile() {
        return jcrFile;
    }

    public void setJcrFile(FileDescriptor jcrFile) {
        this.jcrFile = jcrFile;
    }

    @Override
    public String toString() {
        return "DetachedFileDescriptor{" + "refId=" + getRefId() + '}';
    }
}
