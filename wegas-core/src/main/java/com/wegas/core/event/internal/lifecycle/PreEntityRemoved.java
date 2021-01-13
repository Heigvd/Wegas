/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal.lifecycle;

import com.wegas.core.persistence.AbstractEntity;

/**
 * LifeCycleEvent, fired before entity has been removed
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class PreEntityRemoved<T extends AbstractEntity> extends LifeCycleEvent<T> {

    public PreEntityRemoved(T entity) {
        super(entity, Type.PREREMOVE);
    }
}
