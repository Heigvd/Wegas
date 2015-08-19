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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.validation.constraints.NotNull;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface Broadcastable {

    @JsonIgnore
    default public String getAudienceTokenForGameModel(Long id) {
        return "GameModel-" + id;
    }

    @JsonIgnore
    default public String getAudienceTokenForGame(Long id) {
        return "Game-" + id;
    }

    @JsonIgnore
    default public String getAudienceTokenForTeam(Long id) {
        return "Team-" + id;
    }

    @JsonIgnore
    default public String getAudienceTokenForPlayer(Long id) {
        return "Player-" + id;
    }

    @JsonIgnore
    default public String getAudienceToken(Game game) {
        return this.getAudienceTokenForGame(game.getId());
    }

    @JsonIgnore
    default public String getAudienceToken(GameModel gameModel) {
        return this.getAudienceTokenForGameModel(gameModel.getId());
    }

    @JsonIgnore
    default public String getAudienceToken(Team team) {
        return this.getAudienceTokenForTeam(team.getId());
    }

    @JsonIgnore
    default public String getAudienceToken(Player player) {
        return this.getAudienceTokenForPlayer(player.getId());
    }

    /**
     * key identifier may be: GameModel-<ID>, Game-<ID>, Team-<ID> or
     * Player-<ID>
     *
     * @return
     */
    @JsonIgnore
    public Map<String, List<AbstractEntity>> getEntities();
}
