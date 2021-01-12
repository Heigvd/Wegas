/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.Mergeable;
import java.util.HashMap;
import java.util.Map;

/**
 * Provide some help to use Wegas AbstractEntities
 *
 * @author maxence
 */
public class WegasEntitiesHelper {

    /**
     * static storage for WegasEntityFields
     */
    private static final Map<Class<? extends Mergeable>, WegasEntityFields> iterators = new HashMap<>();

    private WegasEntitiesHelper() {
        // empty private constructor to prevent class initialisation
    }

    /**
     * Get WegasEntityProperty fields descriptor for the given class
     *
     * @param klass a class which extends Mergeable
     *
     * @return all WegasEntityProperty defined within klass and all its super-classes
     */
    public static WegasEntityFields getEntityIterator(Class<? extends Mergeable> klass) {
        synchronized (iterators) {
            if (iterators.containsKey(klass)) {
                return iterators.get(klass);
            } else {
                WegasEntityFields wegasEntityFields = new WegasEntityFields(klass);
                iterators.put(klass, wegasEntityFields);
                return wegasEntityFields;
            }
        }
    }
}
