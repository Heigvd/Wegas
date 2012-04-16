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

import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "NumberVariableDescriptor")
public class NumberDescriptorEntity extends VariableDescriptorEntity<NumberInstanceEntity> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("NumberVariableDescriptorEntity");
    /**
     *
     */
    private Long minValue;
    /**
     *
     */
    private Long maxValue;

    /**
     * @return the minValue
     */
    public Long getMinValue() {
        return minValue;
    }

    /**
     * @param minValue the minValue to set
     */
    public void setMinValue(Long minValue) {
        this.minValue = minValue;
    }

    /**
     * @return the maxValue
     */
    public Long getMaxValue() {
        return maxValue;
    }

    /**
     * @param maxValue the maxValue to set
     */
    public void setMaxValue(Long maxValue) {
        this.maxValue = maxValue;
    }
}
