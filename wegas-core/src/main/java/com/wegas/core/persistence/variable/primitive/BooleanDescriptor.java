/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class BooleanDescriptor extends VariableDescriptor<BooleanInstance> implements PrimitiveDescriptorI<Boolean> {

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
     * @return value of player p instance
     */
    @Override
    public Boolean getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    @JsonIgnore
    public Boolean isFalse(Player p) {
        return !this.getValue(p);
    }

    @Override
    public void setValue(Player p, Boolean v){
        this.getInstance(p).setValue(v);
    }


        
}
