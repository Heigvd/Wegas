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
        super(DEBUGGAMENAME);                                                 // Name is fixed
        Team t = new Team("Test team 1");                                       // Add a default team
        t.addPlayer(new Player("Test player 1"));
        t.addPlayer(new Player("Test player 2"));
        this.addTeam(t);
        Team t2 = new Team("Test team 2");                                      // Add a default team
        t2.addPlayer(new Player("Test player 3"));
        t2.addPlayer(new Player("Test player 4"));
        this.addTeam(t2);
    }
}
