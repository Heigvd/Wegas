/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.game.Player;
import java.io.Serializable;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class PlayerAction implements Serializable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private Player player;

    /**
     *
     */
    public PlayerAction() {
    }

    /**
     *
     * @param p
     */
    public PlayerAction(Player p) {
        this.player = p;
    }

    /**
     * @return the player
     */
    public Player getPlayer() {
        return player;
    }

    /**
     * @param player the player to set
     */
    public void setPlayer(Player player) {
        this.player = player;
    }
}
