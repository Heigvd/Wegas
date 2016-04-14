/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
     * @return
     */
    int size();

    /**
     *
     * @param index
     * @return
     */
    T item(int index);

    /**
     *
     * @param item
     * @return
     */
    boolean remove(T item);
}
