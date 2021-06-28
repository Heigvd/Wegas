/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.WithId;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.view.Hidden;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @param <T>
 */
public interface DescriptorListI<T extends VariableDescriptor> extends WithId {

    /**
     * Sorted shallow copy of items. This list is not managed. Thus
     * any modification will no be propagated to database
     *
     * @return the variableDescriptors
     */
    List<T> getItems();

    /**
     * unsorted managed list of items.
     * One shall modify this list to make effective changes
     *
     * @return
     */
    List<T> getRawItems();

    /**
     * return he gameModel this belongs to sugar for default methods
     *
     * @return the gameModel owning this descriptor list
     */
    @JsonIgnore
    GameModel getGameModel();

    /**
     * Return children ids DO NOT OVERRIDE, NEVER!
     *
     * @return list of children's id
     */
    @JsonView(Views.IndexI.class)
    @WegasExtraProperty(view = @View(value = Hidden.class, label = ""),
        proposal = EmptyArray.class,
        optional = false, nullable = false
    )
    default List<Long> getItemsIds() {
        List<Long> ids = new LinkedList<>();
        for (T t : this.getReadableItems()) {
            ids.add(t.getId());
        }
        return ids;
    }

    @JsonIgnore
    default List<T> getReadableItems(){
        return getItems();
    }

    /**
     * just do nothing DO NOT OVERRIDE, NEVER!
     *
     * @param itemsIds
     */
    default void setItemsIds(List<Long> itemsIds) {
        // just do nothing: DO NOT OVERRIDE, NEVER!
    }

    /**
     * set brand new children
     *
     * @param items new list of children
     */
    default void setItems(List<T> items) {
        // a new list prevent eclipselink making sh*t with items (like replacing some by null...)
        List<T> newItems = new ArrayList<>();
        newItems.addAll(items);

        this.resetItemsField();

        for (T item : newItems) {
            this.addItem(item);
        }
    }

    /**
     * Re-init items fields to an empty new list
     */
    void resetItemsField();

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

    /**
     * Add a new child. Register the new child within the gameModel (global variable descriptor
     * list) and within its parent.
     *
     * @param index new child position, null means last position
     * @param item  the new child to add
     */
    default void addItem(Integer index, T item) {
        List<T> items = this.getItems();

        if (this.getGameModel() != null) {
            this.getGameModel().addToVariableDescriptors(item);
        }
        if (!items.contains(item)) {
            if (index != null) {
                items.add(index, item);
            } else {
                items.add(item);
            }

            // add the item to the managed list
            this.getRawItems().add(item);

            // rewrite all items indexes
            int i = 0;
            for (T t : items) {
                t.setIndexOrder(i++);
            }
            this.setChildParent(item);
        }
    }

    /**
     *
     * @return number of children
     */
    default int size() {
        return this.getRawItems().size();
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
        return this.getRawItems().remove(item);
    }

    /**
     * Remove item from its parent only, do not remove it from gameModel list
     *
     * @param item
     *
     * @return true if item has been removed from its parent
     */
    default boolean localRemove(T item) {
        return this.getRawItems().remove(item);
    }

    @JsonIgnore
    default List<VariableDescriptor> getOrderedVariableDesacriptors() {
        final List<VariableDescriptor> acc = new ArrayList<>();
        for (VariableDescriptor vd : this.getItems()) {
            acc.add(vd);
            if (vd instanceof DescriptorListI) {
                acc.addAll(((DescriptorListI) vd).getOrderedVariableDesacriptors());
            }
        }
        return acc;
    }

}
