/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Game;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
////import javax.xml.bind.annotation.XmlTransient;

/**
 * Account matching a specific Game
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
public class GameAccount extends JpaAccount {

    private static final long serialVersionUID = 1L;
    private Game game;

    /**
     *
     */
    public GameAccount() {
    }

    public GameAccount(Game game) {
        this.game = game;
    }

    /**
     *
     * @return
     */
    @ManyToOne
    //@XmlTransient
    @JsonIgnore
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
