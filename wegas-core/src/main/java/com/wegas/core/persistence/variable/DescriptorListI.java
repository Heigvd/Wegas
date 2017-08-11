/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @param <T>
 */
public interface DescriptorListI<T extends VariableDescriptor> {

    Long getId();

    /**
     * @return the variableDescriptors
     */
    List<T> getItems();

    /**
     * @param items
     */
    void setItems(List<T> items);

    /**
     *
     * @param item
     */
    void addItem(T item);

    /**
     *
     * @param index
     * @param item
     */
    void addItem(int index, T item);

    /**
     *
     * @return number of children
     */
    int size();

    /**
     *
     * @param index
     * @return iest child
     */
    T item(int index);

    /**
     *
     * @param item
     * @return true if item has successfully been removed
     */
    boolean remove(T item);
}
