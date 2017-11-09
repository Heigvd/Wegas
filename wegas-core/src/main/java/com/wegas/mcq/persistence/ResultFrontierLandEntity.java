/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.WithPermission;

/**
 * depict an entity which make a link between Descriptor world and entity world
 *
 * @author maxence
 */
public interface ResultFrontierLandEntity extends WithPermission {

    public Result getResult();

    @Override
    default public String getRequieredCreatePermission() {
        return this.getResult().getRequieredUpdatePermission();
    }

    @Override
    default public String getRequieredUpdatePermission() {
        // update allowed for player
        return this.getResult().getRequieredReadPermission();
    }

    @Override
    default public String getRequieredDeletePermission() {
        return this.getResult().getRequieredUpdatePermission();
    }
}
