package com.wegas.core.persistence;

import java.util.Comparator;

/**
 * AbstractEntity Comparator, compare by id, ASC, null id safe
 *
 * @param <T> extends AbstractEntity
 */
public class EntityIdComparator<T extends AbstractEntity> implements Comparator<T> {

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
