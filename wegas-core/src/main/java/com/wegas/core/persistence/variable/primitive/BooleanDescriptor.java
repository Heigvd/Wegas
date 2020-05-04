/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.Scriptable;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class BooleanDescriptor extends VariableDescriptor<BooleanInstance> implements PrimitiveDescriptorI<Boolean> {

    private static final long serialVersionUID = 1L;

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
    @Scriptable(label = "is true")
    public Boolean getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    @JsonIgnore
    @Scriptable
    public Boolean isFalse(Player p) {
        return !this.getValue(p);
    }

    @Override
    @Scriptable
    public void setValue(Player p, Boolean v){
        this.getInstance(p).setValue(v);
    }
}
