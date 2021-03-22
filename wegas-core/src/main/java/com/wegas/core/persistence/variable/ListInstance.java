/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class ListInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    /**
     *
     * @param index
     * @return i-est child of the listDescriptor (? why here ?) 
     */
    public VariableDescriptor item(int index) {
        return ((ListDescriptor) this.getDescriptor()).item(index);
    }

}
