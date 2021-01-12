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
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
abstract class LifeCycleEvent<K extends AbstractEntity> {

    private K entity;

    private Type type;

    public LifeCycleEvent(K entity, Type type) {
        this.entity = entity;
        this.type = type;
    }

    public K getEntity() {
        return this.entity;
    }

    public Type getType() {
        return this.type;
    }

    public enum Type {
        PREPERSIST,
        POSTPERSIST,
        PREUPDATE,
        POSTUPDATE,
        PREREMOVE,
    }
}
