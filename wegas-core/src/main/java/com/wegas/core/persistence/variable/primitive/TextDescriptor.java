/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class TextDescriptor extends VariableDescriptor<TextInstance> {

    // **** Sugar for scripts *** //
    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, String value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @return
     */
    public String getValue(Player p) {
        return this.getInstance(p).getValue();
    }
}
