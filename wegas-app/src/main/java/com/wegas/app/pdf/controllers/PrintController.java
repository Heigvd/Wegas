/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.controllers;

import com.wegas.app.jsf.controllers.*;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.ejb.UserFacade;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import org.apache.shiro.SecurityUtils;

/**
 *
 * Controls player access to games
 *
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
@ManagedBean(name = "printController")
@RequestScoped
public class PrintController {

    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @Inject
    ErrorController errorController;

    private Player currentPlayer = null;

    /**
     * CASE #1 export based on a specific user
     */
    @ManagedProperty("#{param.id}")
    private Long playerId;

    /**
     * CASE# 2 export from scenarist/trainer lobby: fetch default user
     */
    @ManagedProperty("#{param.gameModelId}")
    private Long gameModelId;

    /**
     *
     * @return the playerId
     */
    public Long getPlayerId() {
        return playerId;
    }

    /**
     *
     * @param playerId
     */
    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    /**
     *
     * @return gameModelId queryString parameter
     */
    public Long getGameModelId() {
        return gameModelId;
    }

    /**
     *
     * @param gameModelId
     */
    public void setGameModelId(Long gameModelId) {
        this.gameModelId = gameModelId;
    }

    /**
     * @return the currentPlayer
     */
    public Player getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * Get the gameModel linked to the currentPlayer
     * @return get the current gameModel
     */
    public GameModel getGameModel() {
        return getCurrentPlayer().getGameModel();
    }

    /**
     *
     */
    @PostConstruct
    public void init() {
        String permissionToCheck = null;

        // Case #1: print against a specific user 
        if (this.playerId != null) {
            currentPlayer = playerFacade.find(this.playerId);
            if (currentPlayer.getGame() instanceof DebugGame) {
                permissionToCheck = "GameModel:View:gm" + getGameModel().getId();
            } else {
                permissionToCheck = "Game:View:g" + currentPlayer.getGame().getId();
            }
        }

        // Case #2: Export against a gameModel
        if (this.gameModelId != null) {
            try {
                // Select any player in the first game of the game model -> Test Team
                currentPlayer = playerFacade.findByGameModelId(gameModelId);
                permissionToCheck = "GameModel:View:gm" + getGameModel().getId();
            } catch (WegasNoResultException ex) {
                errorController.dispatch("Model " + gameModelId + " has no players.");
            }
        }

        if (currentPlayer == null) {
            // If no player could be found, we redirect to an error page
            errorController.dispatch("The game you are looking for could not be found.");
        } else {
            try {
                if (!userFacade.matchCurrentUser(currentPlayer.getId())
                        && !SecurityUtils.getSubject().isPermitted(permissionToCheck)) {

                    errorController.accessDenied();
                }
            } catch (WegasNotFoundException ex) {
                errorController.accessDenied();
            }
        }
    }
}
