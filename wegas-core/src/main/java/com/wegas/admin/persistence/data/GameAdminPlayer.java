/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.admin.persistence.data;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;

/**
 *
 * @author maxence
 */
public class GameAdminPlayer {

    private String name;
    private Status status;

    public GameAdminPlayer() {
        // required empty constructor
    }

    public GameAdminPlayer(Player p) {
        this.name = p.getName();
        this.status = p.getStatus();
    }

    public GameAdminPlayer(String name, Status status) {
        this.name = name;
        this.status = status;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
