
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015, 2016, 2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import java.util.Comparator;

/**
 * AbstractEntity Comparator, compare by id, ASC, null id safe
 *
 * @param <T> extends AbstractEntity
 */
public class EntityCreatedTimeComparator<T extends DatedEntity> implements Comparator<T> {

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
