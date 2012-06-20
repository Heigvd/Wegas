/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import java.io.IOException;
import java.io.Serializable;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "gameController")
@RequestScoped
public class GameController implements Serializable {

    /**
     *
     */
    @ManagedProperty(value = "#{param.id}")
    private Long playerId;
    /**
     *
     */
    @ManagedProperty(value = "#{param.gameId}")
    private Long gameId;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModeFacade;
    /**
     *
     */
    private Player currentPlayer;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();
        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.find(this.getPlayerId());
        } else if (this.gameId != null) {                                       // If we only have a gameModel id, we select the 1st player of the 1st team of the 1st game
            final GameModel gameModel = gameModeFacade.find(this.gameId);
            currentPlayer = gameModel.getGames().get(0).getTeams().get(0).getPlayers().get(0);
        }
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to the lobby
            externalContext.dispatch("/wegas-editor/view/lobby.xhtml");
        }
    }

    /**
     *
     * @return the game the game the current player belongs to.
     */
    public Game getCurrentGame() {
        return this.getCurrentPlayer().getTeam().getGame();
    }

    /**
     *
     * @return
     */
    public GameModel getCurrentGameModel() {
        return this.getCurrentPlayer().getTeam().getGame().getGameModel();
    }

    /**
     * @return the currentPlayer
     */
    public Player getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * @return the id
     */
    public Long getPlayerId() {
        return playerId;
    }

    /**
     * @param playerId
     */
    public void setPlayerId(final Long playerId) {
        this.playerId = playerId;
    }

    /**
     * @return the gameId
     */
    public Long getGameId() {
        return gameId;
    }

    /**
     * @param gameId the gameId to set
     */
    public void setGameId(final Long gameId) {
        this.gameId = gameId;
    }
}
