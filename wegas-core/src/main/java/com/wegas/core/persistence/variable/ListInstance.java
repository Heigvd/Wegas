/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *                                                                                                 m                                                                                                                                                                                                                                                                                                                                    mm
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class ListInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ListInstance.class);

    @Override
    public void merge(AbstractEntity a) {
        // @fixme make this abstract if there really is nothing to do
    }

    public VariableDescriptor item(int index) {
        return ((ListDescriptor)this.getDescriptor()).item(index);
    }
}