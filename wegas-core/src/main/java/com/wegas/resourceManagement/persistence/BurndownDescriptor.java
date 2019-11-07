/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.View.HtmlView;
import javax.persistence.Basic;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;

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
    @WegasEntityProperty(searchable = true,
            optional = false, nullable= false, proposal = EmptyString.class,
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
