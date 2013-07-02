/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event;

import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.Serializable;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class DescriptorRevivedEvent implements Serializable {

    /**
     *
     */
    private VariableDescriptor entity;

    /**
     *
     */
    public DescriptorRevivedEvent() {
    }

    /**
     *
     * @param p
     */
    public DescriptorRevivedEvent(VariableDescriptor entity) {
        this.entity = entity;
    }

    /**
     * @return the entity
     */
    public VariableDescriptor getEntity() {
        return entity;
    }

    /**
     * @param entity the entity to set
     */
    public void setEntity(VariableDescriptor entity) {
        this.entity = entity;
    }
}
