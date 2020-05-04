/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.AlphanumericComparator;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.Serializable;
import java.util.Comparator;

public class EntityComparators {

    /**
     * AbstractEntity Comparator, compare by id, ASC, null id safe
     *
     * @param <T> extends AbstractEntity
     */
    public static class EntityIdComparator<T extends AbstractEntity> implements Comparator<T>, Serializable {

        @Override
        public int compare(T o1, T o2) {
            if (o1.getId() == null ^ o2.getId() == null) {
                return o1.getId() == null ? -1 : 1;
            }
            if (o1.getId() == null && o2.getId() == null) {
                return 0;
            }
            return o1.getId().compareTo(o2.getId());
        }
    }

    /**
     * Orderable Comparator, compare by order, ASC and null safe
     *
     * @param <T> extends Orderable
     */
    public static class OrderComparator<T extends Orderable> implements Comparator<T>, Serializable {

        @Override
        public int compare(T o1, T o2) {
            if (o1.getOrder() == null ^ o2.getOrder() == null) {
                return o1.getOrder() == null ? -1 : 1;
            }
            if (o1.getOrder() == null && o2.getOrder() == null) {
                return 0;
            }
            return o1.getOrder().compareTo(o2.getOrder());
        }
    }

    public static class CreateTimeComparator<T extends DatedEntity> implements Comparator<T>, Serializable {

        @Override
        public int compare(T o1, T o2) {
            if (o1.getCreatedTime() == null ^ o2.getCreatedTime() == null) {
                return o1.getCreatedTime() == null ? -1 : 1;
            }
            if (o1.getCreatedTime() == null && o2.getCreatedTime() == null) {
                return 0;
            }
            return o1.getCreatedTime().compareTo(o2.getCreatedTime());
        }
    }

    public static class ReverseCreateTimeComparator<T extends DatedEntity> implements Comparator<T>, Serializable {

        @Override
        public int compare(T o1, T o2) {
            if (o1.getCreatedTime() == null ^ o2.getCreatedTime() == null) {
                return o1.getCreatedTime() == null ? 1 : -1;
            }
            if (o1.getCreatedTime() == null && o2.getCreatedTime() == null) {
                return 0;
            }
            return o2.getCreatedTime().compareTo(o1.getCreatedTime());
        }
    }

    public static class VariableDescriptorComparator<T extends VariableDescriptor> implements Comparator<T>, Serializable {
        private final AlphanumericComparator<String> alphaNumComp = new AlphanumericComparator<>();

        @Override
        public int compare(T o1, T o2) {
            return alphaNumComp.compare(o1.getEditorLabel(), o2.getEditorLabel());
        }
    }
}
