/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.DependencyScope;
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
        // ensure to have an empty constructor
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
    @Scriptable(label = "is true", dependsOn = DependencyScope.SELF)
    public Boolean getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    @JsonIgnore
    @Scriptable(dependsOn = DependencyScope.SELF)
    public Boolean isFalse(Player p) {
        return !this.getValue(p);
    }

    @Override
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void setValue(Player p, Boolean v){
        this.getInstance(p).setValue(v);
    }
}
