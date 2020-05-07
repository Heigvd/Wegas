/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.controllers;

import com.wegas.app.jsf.controllers.ErrorController;
import com.wegas.app.jsf.controllers.utils.HttpParam;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.ejb.UserFacade;
import javax.annotation.PostConstruct;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;

/**
 *
 * Controls player access to games
 *
 * @author Maxence
 */
@Named("printController")
@RequestScoped
public class PrintController {

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;
    /**
     *
     */
    @Inject
    private UserFacade userFacade;

    @Inject
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @Inject
    ErrorController errorController;

    @Inject
    private RequestManager requestManager;

    private Player currentPlayer = null;

    /**
     * CASE #1 export based on a specific user
     */
    @Inject
    @HttpParam("id")
    private Long playerId;

    /**
     * CASE# 2 export from scenarist/trainer lobby: fetch default user
     */
    @Inject
    @HttpParam
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
     *
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
        // Case #1: print against a specific user
        if ((this.playerId != null)) {
            currentPlayer = playerFacade.find(this.playerId);
        }

        // Case #2: Export against a gameModel
        if (this.gameModelId != null) {
            GameModel gameModel = gameModelFacade.find(this.gameModelId);
            if (gameModel != null) {
                if (gameModel.isScenario() || gameModel.isModel()) {
                    // use the debug player from the debug game
                    currentPlayer = gameModel.getTestPlayer();
                } else {
                    currentPlayer = playerFacade.findPlayerInGameModel(this.gameModelId, userFacade.getCurrentUser().getId());

                    if (currentPlayer == null) {
                        // fallback: use a test player
                        currentPlayer = gameModel.getTestPlayer();
                    }
                }
            }
        }

        if (currentPlayer == null) {
            // If no player could be found, we redirect to an error page
            errorController.dispatch("The game you are looking for could not be found.");
        } else {
            if (!requestManager.hasPlayerRight(currentPlayer)) {
                errorController.accessDenied();
            }
        }
    }
}
