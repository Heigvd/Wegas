/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class DebugTeam extends Team {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    public DebugTeam() {
        this.setName("Test team");
        this.addPlayer(new Player());
    }

    /**
     *
     * @param name
     */
    public DebugTeam(String name) {
        super(name);
        this.addPlayer(new Player());
    }
}
