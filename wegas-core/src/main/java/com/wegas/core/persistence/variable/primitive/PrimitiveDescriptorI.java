/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.game.Player;

/**
 * VariableDescriptor with getValue(self) and setValue(self, value)
 *
 * @author maxence
 * @param <T> primitive type
 */
public interface PrimitiveDescriptorI<T> {

    /**
     *
     * @param player
     *
     * @return
     */
    T getValue(Player player);

    void setValue(Player player, T value);
}
