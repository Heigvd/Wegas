/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import javax.persistence.Entity;

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
