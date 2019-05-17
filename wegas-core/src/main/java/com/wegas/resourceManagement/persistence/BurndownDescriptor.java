/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import javax.persistence.Basic;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.editor.View.HtmlView;
import com.wegas.editor.View.View;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class BurndownDescriptor extends VariableDescriptor<BurndownInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @JsonView(Views.ExtendedI.class)
    @WegasEntityProperty(searchable = true, nullable = true,
            view = @View(label = "description", value = HtmlView.class))
    private String description;

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }
}
