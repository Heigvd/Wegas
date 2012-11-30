/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.ejb.exception.ConstraintViolationException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "NumberInstance")
public class NumberInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(NumberInstance.class);
    /**
     *
     */
    private double val;

    /**
     * @return the value
     */
    public double getValue() {
        return val;
    }

    /**
     * @param value the value to set
     */
    public void setValue(double value) {
        try {
            if (this.getDescriptor() instanceof NumberDescriptor) {             // @fixme (Occurs when numberinstance are used for list descriptors)

                NumberDescriptor desc = (NumberDescriptor) this.getDescriptor();
                if (( ( desc.getMaxValue() != null && value > desc.getMaxValue().doubleValue() )
                        || ( desc.getMinValue() != null && value < desc.getMinValue().doubleValue() ) )) {
                    throw new ConstraintViolationException(desc.getLabel() + " is out of bound.");
                }
            }
        }
        catch (NullPointerException e) {
            // @fixme (occurs when instance is a defaultInstance)
        }

        this.val = value;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        NumberInstance vi = (NumberInstance) a;
        this.setValue(vi.getValue());
    }
}