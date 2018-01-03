/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.WithPermission;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;

/**
 * depict an entity which make a link between Descriptor world and entity world
 *
 * @author maxence
 */
public interface ResultFrontierLandEntity extends WithPermission {

    public Result getResult();

    @Override
    default public Collection<WegasPermission> getRequieredCreatePermission() {
        return this.getResult().getRequieredUpdatePermission();
    }

    @Override
    default public Collection<WegasPermission> getRequieredUpdatePermission() {
        // update allowed for player
        return this.getResult().getRequieredReadPermission();
    }

    @Override
    default public Collection<WegasPermission> getRequieredDeletePermission() {
        return this.getResult().getRequieredUpdatePermission();
    }
}
