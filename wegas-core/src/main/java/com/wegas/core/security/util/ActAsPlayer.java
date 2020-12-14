/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.util;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.Player;

/**
 *
 * @author maxence
 */
public class ActAsPlayer implements AutoCloseable {

    private final RequestManager requestManager;
    private final Player player;
    private boolean flushOnExit = true;
    private int counter = 1;

    public ActAsPlayer(RequestManager requestManager, Player player) {
        this.requestManager = requestManager;
        this.player = player;
        this.requestManager.setPlayer(player);
    }

    public Player getPlayer() {
        return this.player;
    }

    /**
     * Do not flush entities when releasing the player.
     * You may want to disable such a flush when acting outside a transaction
     *
     * @param v
     */
    public void setFlushOnExit(boolean v){
        this.flushOnExit = v;
    }

    @Override
    public void close() {
        counter--;
        if (counter <= 0) {
            if (flushOnExit) {
                requestManager.flush();
            }
            requestManager.releaseActAsPlayer();
            requestManager.setPlayer(null);
        }
    }

    public void inc() {
        counter++;
    }
}
