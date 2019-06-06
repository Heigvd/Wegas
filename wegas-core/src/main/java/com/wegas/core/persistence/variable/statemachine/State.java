/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.merge.annotations.WegasEntityProperty;
import javax.persistence.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
public class State extends AbstractState<Transition> {

    private static final long serialVersionUID = 1L;

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
