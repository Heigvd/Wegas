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

import com.wegas.core.persistence.game.GameEntity;
import javax.persistence.NoResultException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface GameFacade extends AbstractFacade<GameEntity> {

    public void create(Long gameModelId, GameEntity game);

    public GameEntity getGameByToken(String token) throws NoResultException;
}
