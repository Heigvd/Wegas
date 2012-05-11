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

import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "StringInstance")
public class StringInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(StringInstanceEntity.class);
    private String val;

    public StringInstanceEntity() {

    }
    public StringInstanceEntity(String value) {
        this.val = value;
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
        this.val = value;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        StringInstanceEntity vi = (StringInstanceEntity) a;
        this.setValue(vi.getValue());
    }
}