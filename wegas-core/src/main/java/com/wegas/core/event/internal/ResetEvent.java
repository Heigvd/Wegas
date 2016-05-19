/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ResetEvent implements Serializable {

    private static final long serialVersionUID = 1L;
    private GameModel gameModel = null;
    private Game game = null;
    private Team team = null;
    private Player player = null;

    /**
     *
     * @param player
     */
    public ResetEvent(Player player) {
        this.player = player;
    }

    /**
     *
     * @param team
     */
    public ResetEvent(Team team) {
        this.team = team;
    }

    /**
     *
     * @param game
     */
    public ResetEvent(Game game) {
        this.game = game;
    }

    /**
     *
     * @param gameModel
     */
    public ResetEvent(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    /**
     *
     * @param gameModel
     */
    public void setGameModel(GameModel gameModel) {
        this.player = null;
        this.team = null;
        this.game = null;
        this.gameModel = gameModel;
    }

    /**
     *
     * @param game
     */
    public void setGame(Game game) {
        this.player = null;
        this.team = null;
        this.gameModel = null;
        this.game = game;
    }

    /**
     *
     * @param team
     */
    public void setTeam(Team team) {
        this.gameModel = null;
        this.game = null;
        this.team = team;
        this.player = null;
    }

    /**
     *
     * @param player
     */
    public void setPlayer(Player player) {
        this.gameModel = null;
        this.game = null;
        this.team = null;
        this.player = player;
    }

    /**
     *
     * @return
     */
    public AbstractEntity getContext() {
        if (this.player != null) {
            return player;
        } else if (this.team != null) {
            return team;
        } else if (this.game != null) {
            return this.game;
        } else {
            return this.gameModel;
        }
    }

    /**
     *
     * @return
     */
    public List<Player> getConcernedPlayers() {
        if (this.getContext() instanceof Player) {
            ArrayList<Player> pl = new ArrayList<>();
            pl.add(player);
            return pl;
        } else if (this.getContext() instanceof Team) {
            return team.getPlayers();
        } else if (this.getContext() instanceof Game) {
            return game.getPlayers();
        } else if (this.getContext() instanceof GameModel) {
            return gameModel.getPlayers();
        } else {
            return new ArrayList<>();
        }
    }
}
