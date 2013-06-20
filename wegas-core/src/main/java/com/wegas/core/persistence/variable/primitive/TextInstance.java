/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.Entity;
import javax.persistence.Lob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class TextInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(TextInstance.class);
    @Lob
    private String val;

    /**
     *
     */
    public TextInstance() {
    }

    /**
     *
     * @param value
     */
    public TextInstance(String value) {
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
        TextInstance vi = (TextInstance) a;
        this.setValue(vi.getValue());
    }
}