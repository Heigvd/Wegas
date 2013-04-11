/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event;

import com.wegas.core.persistence.game.Player;
import javax.script.ScriptEngine;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class EngineInvocationEvent {

    private Player player;
    private ScriptEngine engine;

    /**
     *
     * @param player
     * @param engine
     */
    public EngineInvocationEvent(Player player, ScriptEngine engine) {
        this.player = player;
        this.engine = engine;
    }

    /**
     * @return the engine
     */
    public ScriptEngine getEngine() {
        return engine;
    }

    /**
     * @param engine the engine to set
     */
    public void setEngine(ScriptEngine engine) {
        this.engine = engine;
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
