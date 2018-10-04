/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;

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
     * Reset a whole gameModel (all games, all teams and all players)
     *
     * @param gameModel
     */
    void reset(final GameModel gameModel);

    /**
     * Reset a whole gameModel (all games, all teams and all players)
     *
     * @param gameModelId id of the gameModel to reset
     */
    void reset(final Long gameModelId);

    /**
     * Reset a game, its teams and their players
     *
     * @param game the game to reset
     */
    void reset(final Game game);

    /**
     * Reset a team and its players
     *
     * @param team the team to reset
     */
    void reset(final Team team);

    /**
     * reset a player
     *
     * @param player the player to reset
     */
    void reset(final Player player);

    /**
     * No Operations. This method just do nothing but is very useful for some (obscure) purpose
     * like adding breakpoints in a server script
     *
     * @param payload
     */
    void nop(Object payload);
}
