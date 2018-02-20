/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class TextDescriptor extends VariableDescriptor<TextInstance>
implements PrimitiveDescriptorI<String>{

    private static final long serialVersionUID = 1L;

    // ~~~ Sugar for scripts ~~~

    /**
     *
     * @param p
     * @param value
     */
    @Override
    public void setValue(Player p, String value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @return value of player instance
     */
    @Override
    public String getValue(Player p) {
        return this.getInstance(p).getValue();
    }
}
