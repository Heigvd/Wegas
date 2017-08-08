/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import java.util.Comparator;

/**
 * AbstractEntity Comparator, compare by id, ASC, null id safe
 *
 * @deprecated issue #1308
 * @param <T> extends AbstractEntity
 */
@Deprecated
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
