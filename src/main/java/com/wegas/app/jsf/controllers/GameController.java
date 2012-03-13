/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.persistence.game.GameEntity;
import java.io.Serializable;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.SessionScoped;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name="gameController")
@SessionScoped
public class GameController implements Serializable {
/**
 *
 */
    @ManagedProperty(value="#{lobbyController}")
    private LobbyController lobbyControllerRef;
    /**
     *
     */
    public GameController() {
    }
    /**
     *
     * @return
     */
    public GameEntity getCurrentGame() {
        return this.getLobbyControllerRef().getCurrentPlayer().getTeam().getGame();
    }

    /**
     * @return the lobbyControllerRef
     */
    public LobbyController getLobbyControllerRef() {
        return lobbyControllerRef;
    }

    /**
     * @param lobbyControllerRef the lobbyControllerRef to set
     */
    public void setLobbyControllerRef(LobbyController lobbyControllerRef) {
        this.lobbyControllerRef = lobbyControllerRef;
    }
}
