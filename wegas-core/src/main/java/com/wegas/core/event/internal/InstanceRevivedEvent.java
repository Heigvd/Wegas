/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.variable.VariableInstance;

/**
 *
 * @author maxence
 */
public class InstanceRevivedEvent extends EntityRevivedEvent<VariableInstance> {

    private static final long serialVersionUID = 6056961969012765364L;

    public InstanceRevivedEvent() {
        super();
    }

    public InstanceRevivedEvent(VariableInstance vi) {
        super(vi);
    }
}
