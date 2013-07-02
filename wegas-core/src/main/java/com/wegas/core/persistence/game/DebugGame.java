/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class DebugGame extends Game {

    public final static String DEBUGGAMENAME = "Test game";

    public DebugGame() {
        super();
        this.name = DEBUGGAMENAME;                                              // Name is fixed
        Team t = new Team("Default");                                           // Add a default team
        t.addPlayer(new Player("Test player"));
        this.addTeam(t);
    }
}
