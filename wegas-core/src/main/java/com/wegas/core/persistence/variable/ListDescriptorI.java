/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface ListDescriptorI<T extends VariableDescriptor> {

    /**
     * @return the variableDescriptors
     */
    public List<T> getItems();

    /**
     * @param items
     */
    public void setItems(List<T> items);

    /**
     *
     * @param item
     */
    public void addItem(T item);

    /**
     *
     * @param index
     * @return
     */
    public T item(int index);
}
