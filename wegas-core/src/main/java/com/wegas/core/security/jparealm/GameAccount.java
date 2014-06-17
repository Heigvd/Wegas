/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.persistence.game.Game;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlTransient;

/**
 * Account matching a specific Game
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
public class GameAccount extends JpaAccount {

    private Game game;

    /**
     *
     */
    public GameAccount() {
    }

    /**
     *
     * @return
     */
    @ManyToOne
    @XmlTransient
    public Game getGame() {
        return game;
    }

    /**
     *
     * @return
     */
    @Transient
    public String getToken() {
        return this.game.getToken();
    }

    /**
     *
     * @param game
     */
    public void setGame(Game game) {
        this.game = game;
    }

}
