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
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "StringInstance")
public class StringInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("StringInstanceEntity");
    private String val;

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