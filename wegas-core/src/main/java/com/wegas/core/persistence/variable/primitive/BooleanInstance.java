/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.False;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class BooleanInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Column(name = "val")
    @WegasEntityProperty(proposal = False.class, optional = false, nullable = false,
            view = @View(label = "Value"))
    private boolean value;

    /**
     *
     */
    public BooleanInstance() {
    }

    /**
     *
     * @param value
     */
    public BooleanInstance(boolean value) {
        this.value = value;
    }

    /**
     * @return the value
     */
    public boolean getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(boolean value) {
        this.value = value;
    }

}
