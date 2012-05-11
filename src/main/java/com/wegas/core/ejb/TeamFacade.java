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

import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface TeamFacade extends AbstractFacade<TeamEntity> {

    public void create(java.lang.Long gameId, com.wegas.core.persistence.game.TeamEntity t);

    public PlayerEntity joinTeam(Long teamId, Long userId);

    public PlayerEntity createPlayer(Long teamId, PlayerEntity p);
}
