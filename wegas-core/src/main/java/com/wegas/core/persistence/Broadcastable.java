  /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.util.List;
import java.util.Map;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface Broadcastable {

    @JsonIgnore
    default public String getAudianceTokenForGameModel(Long id) {
        return "GameModel-" + id;
    }

    @JsonIgnore
    default public String getAudianceTokenForGame(Long id) {
        return "Game-" + id;
    }

    @JsonIgnore
    default public String getAudianceTokenForTeam(Long id) {
        return "Team-" + id;
    }

    @JsonIgnore
    default public String getAudianceTokenForPlayer(Long id) {
        return "Player-" + id;
    }

    @JsonIgnore
    default public String getAudianceToken(Game game) {
        return this.getAudianceTokenForGame(game.getId());
    }

    @JsonIgnore
    default public String getAudianceToken(GameModel gameModel) {
        return this.getAudianceTokenForGame(gameModel.getId());
    }

    @JsonIgnore
    default public String getAudianceToken(Team team) {
        return this.getAudianceTokenForGame(team.getId());
    }

    @JsonIgnore
    default public String getAudianceToken(Player player) {
        return this.getAudianceTokenForGame(player.getId());
    }

    /**
     * key identifier may be: - GameModel-<ID>
     * - Game-<ID>
     * - Team-<ID>
     * - Player-<ID>
     *
     * @return
     */
    @JsonIgnore
    public Map<String, List<AbstractEntity>> getEntities();
}
