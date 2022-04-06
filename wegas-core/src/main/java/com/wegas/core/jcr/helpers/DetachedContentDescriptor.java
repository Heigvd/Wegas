/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;

/**
 * Represent a detached JCR file or directory.
 *
 * @author maxence
 */
@WegasEntity(callback = DetachedCb.class, factory = DetachedJcrFactory.class)
public abstract class DetachedContentDescriptor implements Mergeable, NamedEntity  {

    private String name;

    private DetachedDirectoryDescriptor parent;

    @WegasEntityProperty(nullable = false)
    private String refId;

    @WegasEntityProperty
    private String mimeType;

    @WegasEntityProperty
    private String note;

    @WegasEntityProperty
    private String description;

    @WegasEntityProperty
    private Visibility visibility;

    @Override
    public String getRefId() {
        return refId;
    }

    @Override
    public void setRefId(String refId) {
        this.refId = refId;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Visibility getVisibility() {
        return visibility;
    }

    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    public DetachedDirectoryDescriptor getParent() {
        return parent;
    }

    public void setParent(DetachedDirectoryDescriptor parent) {
        this.parent = parent;
    }

    @Override
    public DetachedDirectoryDescriptor getMergeableParent() {
        return this.parent;
    }
}
