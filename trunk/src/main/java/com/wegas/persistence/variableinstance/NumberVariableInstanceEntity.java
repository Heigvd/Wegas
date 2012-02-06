/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.variableinstance;

import com.wegas.persistence.AnonymousEntity;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "NumberVariableInstance")
public class NumberVariableInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("StringVariableInstanceEntity");
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
        this.val = value;
    }

    /**
     * 
     * @param a
     */
    @Override
    public void merge(AnonymousEntity a) {
        NumberVariableInstanceEntity vi = (NumberVariableInstanceEntity) a;
        this.setValue(vi.getValue());
    }
}