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
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ResetEvent implements Serializable {

    private static final long serialVersionUID = 1L;
    private GameModel gameModel = null;
    private Game game = null;

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
        this.game = null;
        this.gameModel = gameModel;
    }

    /**
     *
     * @param game
     */
    public void setGame(Game game) {
        this.gameModel = null;
        this.game = game;
    }

    /**
     *
     * @return
     */
    public AbstractEntity getContext() {
        if (this.game == null) {
            return this.gameModel;
        } else {
            return this.game;
        }
    }

    /**
     *
     * @return
     */
    public List<Player> getConcernedPlayers() {
        if (this.getContext() instanceof Game) {
            return ((Game) (this.getContext())).getPlayers();
        } else if (this.getContext() instanceof GameModel) {
            return ((GameModel) (this.getContext())).getPlayers();
        } else {
            return new ArrayList<>();
        }
    }
}
