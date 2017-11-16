/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import java.util.ArrayList;
import java.util.Collection;

/**
 *
 * @author maxence
 */
public abstract class WegasPermission {

    public static final Collection<WegasPermission> FORBIDDEN = new ArrayList<>();

    public static Collection<WegasPermission> getAsCollection(WegasPermission... permissions) {
        Collection<WegasPermission> list = new ArrayList<>(permissions.length);
        for (WegasPermission perm : permissions) {
            list.add(perm);
        }
        return list;
    }

    @Override
    public abstract boolean equals(Object other);

    @Override
    public abstract String toString();

    @Override
    public abstract int hashCode();

}
