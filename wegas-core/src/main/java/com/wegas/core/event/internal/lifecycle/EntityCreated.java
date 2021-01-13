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
 * LifeCycleEvent, fired once entity has been created
 * @author Cyril Junod (cyril.junod at gmail.com)
 * @param <T>
 */
public class EntityCreated<T extends AbstractEntity> extends LifeCycleEvent<T> {

    public EntityCreated(T entity) {
        super(entity, Type.POSTPERSIST);
    }
}
