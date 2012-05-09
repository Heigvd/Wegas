/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameModelEntity;
import java.util.List;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface GameModelFacade {

    /**
     *
     * @param entity
     */
    public void create(GameModelEntity entity);

    /**
     *
     * @param entity
     */
    public void edit(final GameModelEntity entity);

    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    public GameModelEntity update(final Long entityId, final GameModelEntity entity);

    /**
     *
     * @param entity
     */
    public void remove(GameModelEntity entity);

    /**
     *
     * @param id
     * @return
     */
    public GameModelEntity find(final Object id);

    /**
     *
     * @return
     */
    public int count();

    /**
     *
     * @return
     */
    public List<GameModelEntity> findAll();

    /**
     *
     * @param range
     * @return
     */
    public List<GameModelEntity> findRange(int[] range);

    /**
     *
     * @param gameModelId
     * @return
     */
    public GameModelEntity reset(Long gameModelId);

    /**
     *
     */
    public void flush();
}
