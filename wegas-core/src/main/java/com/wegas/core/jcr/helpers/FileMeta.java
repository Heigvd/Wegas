/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.helpers;

import com.wegas.core.persistence.variable.ModelScoped;

/**
 * Convenient way to serialize file meta within an exploded ZIP
 *
 * @author maxence
 */
public class FileMeta {

    private String note;
    private String description;
    private String mimeType;
    private ModelScoped.Visibility visibility;

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

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public ModelScoped.Visibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ModelScoped.Visibility visibility) {
        this.visibility = visibility;
    }

}
