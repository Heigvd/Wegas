/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators;
import javax.persistence.Entity;

/**
 * Dummy instance for SurveySectionDescriptor.
 *
 */
@Entity
public class SurveySectionInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.True.class,
        view = @View(label = "Active"))
    private Boolean active = true;


    /**
     * Empty constructor
     */
    public SurveySectionInstance() {
        // ensure there is an empty constructor
    }

    /**
     * @return the active
     */
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(Boolean active) {
        this.active = active;
    }

}
