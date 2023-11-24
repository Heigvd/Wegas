/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.editor.ValueGenerators.EmptyString;
import jakarta.persistence.Entity;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
public class Transition extends AbstractTransition {

    /**
     *
     */
    @WegasEntityProperty(searchable = true,
        optional = false, nullable = false, proposal = EmptyString.class,
        view = @View(label = "Label"))
    private String label;

    /**
     * @return state name
     */
    public String getLabel() {
        return label;
    }

    /**
     * @param label
     */
    public void setLabel(String label) {
        this.label = label;
    }
}
