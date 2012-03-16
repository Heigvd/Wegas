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

import com.wegas.core.ejb.GameModelEntityFacade;
import com.wegas.core.ejb.PlayerEntityFacade;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import java.io.IOException;
import java.io.Serializable;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
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
    private Long id;
    /**
     *
     */
    @ManagedProperty(value = "#{param.gameId}")
    private Long gameId;
    /**
     *
     */
    @EJB
    private PlayerEntityFacade playerEntityFacade;
    /**
     *
     */
    @EJB
    private GameModelEntityFacade gameModelEntityFacade;
    /**
     *
     */
    private PlayerEntity currentPlayer;

    /**
     *
     * @throws IOException 
     */
    @PostConstruct
    public void init() throws IOException {
        if (this.id != null) {
            currentPlayer = playerEntityFacade.find(getId());
            if (currentPlayer == null) {
                FacesContext.getCurrentInstance().getExternalContext().dispatch("/wegas-app/view/lobby.xhtml");
            }
        } else if (this.gameId != null) {
            currentPlayer = gameModelEntityFacade.find(this.gameId).getGames().get(0).getTeams().get(0).getPlayers().get(0);
            if (currentPlayer == null) {
                FacesContext.getCurrentInstance().getExternalContext().dispatch("/wegas-editor/view/lobby.xhtml");
            }
        }
    }

    /**
     *
     * @return
     */
    public GameEntity getCurrentGame() {
        return this.getCurrentPlayer().getTeam().getGame();
    }

    /**
     *
     * @return
     */
    public GameModelEntity getCurrentGameModel() {
        return this.getCurrentPlayer().getTeam().getGame().getGameModel();
    }

    /**
     * @return the currentPlayer
     */
    public PlayerEntity getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * @return the id
     */
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
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
    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }
}
