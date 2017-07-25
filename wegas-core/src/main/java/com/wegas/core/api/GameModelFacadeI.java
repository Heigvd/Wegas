/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.GameModel;

/**
 *
 * @author maxence
 */
public interface GameModelFacadeI {

    /**
     * Refresh an entity. Reload it from DB and revert any uncommitted change
     *
     * @param entity the entity to refresh
     */
    void refresh(final GameModel entity);

    /**
     * @param gameModel
     */
    void reset(final GameModel gameModel);

    /**
     * @param gameModelId
     */
    void reset(final Long gameModelId);


}
