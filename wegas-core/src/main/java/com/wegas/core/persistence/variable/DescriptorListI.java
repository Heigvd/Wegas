/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
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
import com.wegas.editor.View.Hidden;
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
    @WegasExtraProperty(view = @View(value = Hidden.class, label = ""),
            proposal = EmptyArray.class,
            optional = false, nullable = false
    )
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
     * Add a new child. Register the new child within the gameModel (global variable descriptor list)
     * and within its parent.
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
     * @return true if item has been removed from its parent
     */
    default boolean localRemove(T item) {
        return this.getItems().remove(item);
    }


    @JsonIgnore
    default public List<VariableDescriptor> getOrderedVariableDesacriptors() {
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
