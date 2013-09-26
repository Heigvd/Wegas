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
        Team t = new Team("Team 1");                                            // Add a default team
        t.addPlayer(new Player("Peter"));
        t.addPlayer(new Player("Roger"));
        this.addTeam(t);
        Team t2 = new Team("Team 2");                                           // Add a default team
        t.addPlayer(new Player("Marc"));
        t.addPlayer(new Player("Fred"));
        this.addTeam(t);
    }
}
