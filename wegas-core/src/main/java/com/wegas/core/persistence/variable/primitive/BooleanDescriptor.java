/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class BooleanDescriptor extends VariableDescriptor<BooleanInstance> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(BooleanDescriptor.class);

    /**
     *
     */
    public BooleanDescriptor() {
    }

    /**
     *
     * @param name
     */
    public BooleanDescriptor(String name) {
        this.name = name;
    }


    /*
     * SUGAR
     */

    /**
     *
     * @param p
     * @return
     */
    public boolean getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    public void setValue(Player p, boolean v){
        this.getInstance(p).setValue(v);
    }
}
