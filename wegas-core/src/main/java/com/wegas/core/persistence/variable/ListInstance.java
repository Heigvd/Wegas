/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class ListInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ListInstance.class);

    /**
     *
     * @param index
     * @return
     */
    public VariableDescriptor item(int index) {
        return ((ListDescriptor) this.getDescriptor()).item(index);
    }

}
