/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
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

    @Override
    public void merge(AbstractEntity a) {
        // @fixme make this abstract if there really is nothing to do
        super.merge(a);
    }

    /**
     *
     * @param index
     * @return i-est child of the listDescriptor (? why here ?) 
     */
    public VariableDescriptor item(int index) {
        return ((ListDescriptor) this.getDescriptor()).item(index);
    }
}
