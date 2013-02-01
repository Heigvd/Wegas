/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.persistence.game.Player;
import com.wegas.messaging.persistence.Message;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class MessageEvent {

    /**
     *
     */
    private String type;
    /**
     *
     */
    private Message message;
    /**
     *
     */
    private Player player;

    /**
     * @return the type
     */
    public String getType() {
        return type;
    }

    /**
     * @param type the type to set
     */
    public void setType(String type) {
        this.type = type;
    }

    /**
     * @return the message
     */
    public Message getMessage() {
        return message;
    }

    /**
     * @param message the message to set
     */
    public void setMessage(Message message) {
        this.message = message;
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
