/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;

/**
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class PlayerToGameModel {

    private Player player;
    private Team team;
    private Game game;
    private GameModel gameModel;

    /**
     * Get the value of player
     *
     * @return the value of player
     */
    public Player getPlayer() {
        return player;
    }

    /**
     * Set the value of player
     *
     * @param player new value of player
     */
    public void setPlayer(Player player) {
        this.player = player;
    }

    /**
     * Get the value of team
     *
     * @return the value of team
     */
    public Team getTeam() {
        return team;
    }

    /**
     * Set the value of team
     *
     * @param team new value of team
     */
    public void setTeam(Team team) {
        this.team = team;
    }

    /**
     * Get the value of game
     *
     * @return the value of game
     */
    public Game getGame() {
        return game;
    }

    /**
     * Set the value of game
     *
     * @param game new value of game
     */
    public void setGame(Game game) {
        this.game = game;
    }

    /**
     * Get the value of gameModel
     *
     * @return the value of gameModel
     */
    public GameModel getGameModel() {
        return gameModel;
    }

    /**
     * Set the value of gameModel
     *
     * @param gameModel new value of gameModel
     */
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    public static PlayerToGameModel build(Player p) {
        PlayerToGameModel ptgm = new PlayerToGameModel();
        ptgm.setPlayer(p);
        Team t = p.getTeam();
        if (t != null) {
            ptgm.setTeam(t);
            Game g = t.getGame();
            if (g != null) {
                ptgm.setGame(g);
                ptgm.setGameModel(g.getGameModel());
            }
        }
        return ptgm;
    }
}
