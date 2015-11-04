/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.List;
import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class StringInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(StringInstance.class);
    private String val;

    /**
     *
     */
    public StringInstance() {
    }

    /**
     *
     * @param value
     */
    public StringInstance(String value) {
        this.val = value;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        StringInstance vi = (StringInstance) a;
        this.setValue(vi.getValue());
    }

    /**
     * @return the value
     */
    public String getValue() {
        return val;
    }

    /**
     * @param value the value to set
     */
    public void setValue(String value) {
        VariableDescriptor vd = this.getDescriptorOrDefaultDescriptor();
        if (vd instanceof StringDescriptor) {
            StringDescriptor sd = (StringDescriptor) vd;
            if (!sd.isValueAllowed(value)){
                throw WegasErrorMessage.error("Value \"" + value + "\" not allowed !");
            }
        }

        this.val = value;
    }
}
