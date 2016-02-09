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

    public Long getId();

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
     * @param item
     */
    public void addItem(int index, T item);

    /**
     *
     * @return
     */
    public int size();

    /**
     *
     * @param index
     * @return
     */
    public T item(int index);

    /**
     *
     * @param item
     * @return
     */
    public boolean remove(T item);
}
