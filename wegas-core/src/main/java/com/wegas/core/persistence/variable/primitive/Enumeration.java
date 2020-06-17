/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
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
    List<EnumItem> getEnumItems();

    @JsonIgnore
    default List<EnumItem> getSortedEnumItems() {
        return Helper.copyAndSortModifiable(this.getEnumItems(), new EntityComparators.OrderComparator<>());
    }


    default EnumItem findItem(String itemName) {
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
     * @param langCode
     */
    default void addEnumItem(String name, String langCode) {
        if (this.findItem(name) == null) {
            EnumItem item = new EnumItem();
            item.setName(name);
            item.setLabel(TranslatableContent.build(langCode, name));
            item.setOrder(this.getEnumItems().size());
            this.registerItem(item);

            this.getEnumItems().add(item);
        }
    }

    /**
     * @param item
     */
    void registerItem(EnumItem item);

    /**
     * remove an item from the enumeration
     *
     * @param itemName name of the item to remove
     *
     * @return the item which has been removed or null such an item does not exist
     */
    default EnumItem removeItem(String itemName) {
        EnumItem item = this.findItem(itemName);
        this.getEnumItems().remove(item);
        return item;
    }
}
