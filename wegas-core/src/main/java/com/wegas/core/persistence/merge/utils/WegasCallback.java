/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.merge.utils;

import com.wegas.core.persistence.AbstractEntity;

/**
 *
 * @author maxence
 */
public interface WegasCallback {

    default public void postPersist(AbstractEntity entity, Object identifier) {

    }

    default public void preUpdate(AbstractEntity entity, Object newValue, Object identifier) {

    }

    default public void postUpdate(AbstractEntity entity, Object ref, Object identifier) {

    }

    default public void preDestroy(AbstractEntity entity, Object identifier) {

    }
}
