/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.merge.utils.WegasCallback;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.rest.util.Views;
import java.util.LinkedList;
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

    @JsonView(Views.IndexI.class)
    default List<Long> getItemsIds() {
        List<Long> ids =new LinkedList<>();
        for (T t : this.getItems()){
            ids.add(t.getId());
        }
        return ids;
    }

    default void setItemsIds(List<Long> itemsIds){
    }

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
    void addItem(Integer index, T item);

    /**
     *
     * @return number of children
     */
    int size();

    /**
     *
     * @param index
     *
     * @return iest child
     */
    T item(int index);

    /**
     *
     * @param item
     *
     * @return true if item has successfully been removed
     */
    boolean remove(T item);

    public static class UpdateChild implements WegasCallback {

        @Override
        public void add(Object entity, Object container, Object identifier) {
            if (container instanceof DescriptorListI && entity instanceof VariableDescriptor) {
                DescriptorListI parent = (DescriptorListI) container;
                parent.addItem((VariableDescriptor) entity);
            }
        }

        @Override
        public Object remove(Object entity, Object container, Object identifier) {
            //DescriptorListI list = (DescriptorListI) entity;
            if (container instanceof DescriptorListI && entity instanceof VariableDescriptor) {
                DescriptorListI parent = (DescriptorListI) container;
                parent.remove((VariableDescriptor) entity);
            }
            return null;
        }
    }
}
