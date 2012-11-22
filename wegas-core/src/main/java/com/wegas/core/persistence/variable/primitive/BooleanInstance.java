/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.primitive;

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
@XmlType(name = "BooleanInstance")
public class BooleanInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(BooleanInstance.class);
    /**
     *
     */
    private boolean val;

    /**
     *
     */
    public BooleanInstance() {
    }

    /**
     *
     * @param value
     */
    public BooleanInstance(boolean value) {
        this.val = value;
    }

    /**
     * @return the value
     */
    public boolean getValue() {
        return val;
    }

    /**
     * @param value the value to set
     */
    public void setValue(boolean value) {
        this.val = value;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        BooleanInstance other = (BooleanInstance) a;
        this.setValue(other.getValue());
    }
}