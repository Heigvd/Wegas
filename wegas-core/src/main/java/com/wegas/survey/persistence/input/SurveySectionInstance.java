/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators;
import javax.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Dummy instance for SurveySectionDescriptor.
 *
 */
@Entity
public class SurveySectionInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(SurveySectionInstance.class);

    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.True.class,
        view = @View(label = "Active"))
    private Boolean active = true;


    /**
     * Empty constructor
     */
    public SurveySectionInstance() {

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
