/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event;

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

    private GameModel gameModel = null;
    private Game game = null;

    public ResetEvent(Game game) {
        this.game = game;
    }

    public ResetEvent(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    public void setGameModel(GameModel gameModel) {
        this.game = null;
        this.gameModel = gameModel;
    }

    public void setGame(Game game) {
        this.gameModel = null;
        this.game = game;
    }

    public AbstractEntity getContext() {
        if (this.game == null) {
            return this.gameModel;
        } else {
            return this.game;
        }
    }

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
