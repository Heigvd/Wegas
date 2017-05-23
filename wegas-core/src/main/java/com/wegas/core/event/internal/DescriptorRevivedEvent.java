/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.variable.VariableDescriptor;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class DescriptorRevivedEvent extends EntityRevivedEvent<VariableDescriptor> {

    private static final long serialVersionUID = 4127903472615797668L;

    public DescriptorRevivedEvent() {
        super();
    }

    public DescriptorRevivedEvent(VariableDescriptor vd) {
        super(vd);
    }
}
