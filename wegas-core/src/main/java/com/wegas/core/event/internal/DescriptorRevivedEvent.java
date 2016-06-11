/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.Serializable;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class DescriptorRevivedEvent implements Serializable {

    private static final long serialVersionUID = 1L;
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
     * @param entity
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
