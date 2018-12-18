/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.security.ejb.UserFacade;
import javax.annotation.PostConstruct;
import javax.enterprise.context.RequestScoped;
import javax.faces.annotation.ManagedProperty;
import javax.inject.Inject;
import javax.inject.Named;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("editorGameController")
@RequestScoped
public class EditorGameController extends AbstractGameController {

    private static final long serialVersionUID = 1396920765516903529L;

    /**
     *
     */
    @ManagedProperty("#{param.gameId}")
    private Long gameId;
    /**
     *
     */
    @ManagedProperty("#{param.gameModelId}")
    private Long gameModelId;
    /**
     *
     */
    @ManagedProperty("#{param.teamId}")
    private Long teamId;
    /**
     *
     */
    @Inject
    private TeamFacade teamFacade;
    @Inject
    private GameFacade gameFacade;
    @Inject
    private PlayerFacade playerFacade;
    @Inject
    private GameModelFacade gameModelFacade;
    @Inject
    private UserFacade userFacade;
    @Inject
    private RequestManager requestManager;

    @Inject
    ErrorController errorController;

    /**
     *
     */
    @PostConstruct
    public void init() {

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.find(this.getPlayerId());

        } else if (this.teamId != null) {                                       // If a team id is provided
            try {
                currentPlayer = teamFacade.find(this.teamId).getPlayers().get(0);// Return the first player

            } catch (ArrayIndexOutOfBoundsException ex) {
                errorController.dispatch("Empty Game", "Team " + teamFacade.find(this.teamId).getName() + " has no player.");

            }

        } else if (this.gameModelId != null) {                                  // If we only have a gameModel id
            currentPlayer = playerFacade.findDebugPlayerByGameModelId(this.gameModelId);
            if (currentPlayer == null) {

                errorController.dispatch("Empty GameModel", "Model " + gameModelFacade.find(this.gameModelId).getName() + " has no players.");
            }

        } else if (this.gameId != null) {
            // If a game id is provided, select any test player in that game
            currentPlayer = playerFacade.findDebugPlayerByGameId(this.gameId);

            if (currentPlayer == null) {
                Game g = gameFacade.find(this.gameId);
                if (g != null) {
                    errorController.dispatch("Empty Game", "Game " + g.getName() + " has no players.");
                } else {
                    errorController.gameNotFound();
                }
            }
        }
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            errorController.dispatch("Empty Team", "Team " + teamFacade.find(this.teamId).getName() + " has no player.");
        } else if (!requestManager.hasGameWriteRight(currentPlayer.getGame())) {
            errorController.accessDenied();
        }

    }

    /**
     * @return the teamId
     */
    public Long getTeamId() {
        return teamId;
    }

    /**
     * @param teamId the teamId to set
     */
    public void setTeamId(Long teamId) {
        this.teamId = teamId;
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

    /**
     * @return the gameModelId
     */
    public Long getGameModelId() {
        return gameModelId;
    }

    /**
     * @param gameModelId the gameModelId to set
     */
    public void setGameModelId(Long gameModelId) {
        this.gameModelId = gameModelId;
    }
}
