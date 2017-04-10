package com.wegas.core.persistence;

import java.util.Comparator;

public class EntityComparators {

    /**
     * AbstractEntity Comparator, compare by id, ASC, null id safe
     *
     * @param <T> extends AbstractEntity
     */
    public static class EntityIdComparator<T extends AbstractEntity> implements Comparator<T> {

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
    public static class OrderComparators<T extends Orderable> implements Comparator<T> {

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

}
