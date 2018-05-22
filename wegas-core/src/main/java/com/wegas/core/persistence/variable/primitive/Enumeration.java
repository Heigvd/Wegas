/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.EntityComparators;
import java.util.List;

/**
 *
 * @author maxence
 */
public interface Enumeration {

    @JsonIgnore
    public List<EnumItem> getEnumItems();

    @JsonIgnore
    default public List<EnumItem> getSortedEnumItems() {
        return Helper.copyAndSortModifiable(this.getEnumItems(), new EntityComparators.OrderComparator<>());
    }


    default public EnumItem findItem(String itemName) {
        if (itemName != null) {
            for (EnumItem category : this.getEnumItems()) {
                if (itemName.equals(category.getName())) {
                    return category;
                }
            }
        }
        return null;
    }

    /**
     * Add a item to the enumeration
     *
     * @param name name and default label of the new item
     */
    default public void addEnumItem(String name) {
        if (this.findItem(name) == null) {
            EnumItem item = new EnumItem();
            item.setName(name);
            item.setLabel(TranslatableContent.build("def", name));
            item.setOrder(this.getEnumItems().size());
            this.registerItem(item);

            this.getEnumItems().add(item);
        }
    }

    /**
     * @param item
     */
    public void registerItem(EnumItem item);

    /**
     * remove an item from the enumeration
     *
     * @param itemName name of the item to remove
     *
     * @return the item which has been removed or null such an item does not exist
     */
    default public EnumItem removeItem(String itemName) {
        EnumItem item = this.findItem(itemName);
        this.getEnumItems().remove(item);
        return item;
    }

    /**
     * Test criteria against each item
     *
     * @param criterias
     *
     * @return
     */
    default Boolean itemsContainsAll(List<String> criterias) {
        for (EnumItem item : this.getEnumItems()) {
            if (item.containsAll(criterias)) {
                return true;
            }
        }
        return false;
    }

}
