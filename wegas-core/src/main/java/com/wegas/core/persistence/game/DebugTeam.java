/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class DebugTeam extends Team {

    /**
     *
     */
    public DebugTeam() {
        this.setName("Test team");                                              // Name is fixed
        this.addPlayer(new Player("Test player"));
    }

    /**
     *
     * @param name
     */
    public DebugTeam(String name) {
        super(name);
        this.addPlayer(new Player("Animator 1"));
    }
}
