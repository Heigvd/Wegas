/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.Views;
import java.util.LinkedList;
import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @param <T>
 */
public interface DescriptorListI<T extends VariableDescriptor> {

    /**
     * useful ?
     *
     * @return
     */
    Long getId();

    /**
     * @return the variableDescriptors
     */
    List<T> getItems();

    /**
     * return he gameModel this belongs to
     * sugar for default methods
     *
     * @return the gameModel owning this descriptor list
     */
    @JsonIgnore
    public GameModel getGameModel();

    /**
     * Return children ids
     * DO NOT OVERRIDE, NEVER!
     *
     * @return list of children's id
     */
    @JsonView(Views.IndexI.class)
    default List<Long> getItemsIds() {
        List<Long> ids = new LinkedList<>();
        for (T t : this.getItems()) {
            ids.add(t.getId());
        }
        return ids;
    }

    /**
     * just do nothing
     * DO NOT OVERRIDE, NEVER!
     *
     * @param itemsIds
     */
    default void setItemsIds(List<Long> itemsIds) {
    }

    /**
     * set brand new children
     *
     * @param items new list of children
     */
    void setItems(List<T> items);

    /**
     * Update child in order to maintain cache integrity.
     *
     * @param child the new child which needs to knows its new parent
     */
    void setChildParent(T child);

    /**
     * Add a new child at the end of items
     *
     * @param item the new child to add
     */
    default void addItem(T item) {
        this.addItem(null, item);
    }

    default void registerItems(T item) {
        if (this.getGameModel() != null) {
            this.getGameModel().addToVariableDescriptors(item);
        }
        this.setChildParent(item);
    }

    /**
     * Add a new child
     *
     * @param index new child position, null means last position
     * @param item  the new child to add
     */
    default void addItem(Integer index, T item) {
        if (this.getGameModel() != null) {
            this.getGameModel().addToVariableDescriptors(item);
        }
        if (index != null) {
            this.getItems().add(index, item);
        } else {
            this.getItems().add(item);
        }
        this.setChildParent(item);
    }

    /**
     *
     * @return number of children
     */
    default int size() {
        return this.getItems().size();
    }

    /**
     *
     * @param index
     *
     * @return iest child
     */
    default T item(int index) {
        return this.getItems().get(index);
    }

    /**
     * Remove child from its parent and from the gameModel
     *
     * @param item
     *
     * @return true if item has successfully been removed
     */
    default boolean remove(T item) {
        this.getGameModel().removeFromVariableDescriptors(item);
        return this.getItems().remove(item);
    }

    /**
     * Remove item from its parent only, do not remove it from gameModel list
     *
     * @param item
     *
     * @return
     */
    default boolean localRemove(T item) {
        return this.getItems().remove(item);
    }

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
