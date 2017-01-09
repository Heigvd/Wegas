/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.util.SecurityHelper;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.inject.Inject;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@ManagedBean(name = "editorGameController")
@RequestScoped
public class EditorGameController extends AbstractGameController {

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
    @EJB
    private TeamFacade teamFacade;
    @EJB
    private GameFacade gameFacade;
    @EJB
    private PlayerFacade playerFacade;
    @EJB
    private GameModelFacade gameModelFacade;
    @EJB
    private UserFacade userFacade;
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
                errorController.dispatch("Team " + teamFacade.find(this.teamId).getName() + " has no player.");

            }

        } else if (this.gameModelId != null) {                                  // If we only have a gameModel id
            try {
                //currentPlayer = playerFacade.findByGameModelId(this.gameModelId);// Select any player in this game model

                GameModel gameModel = gameModelFacade.find(this.gameModelId);
                currentPlayer = playerFacade.findDebugPlayerByGameId(gameModel.getGames().get(0).getId());   // Select any player in the first game of the game model

            } catch (WegasNoResultException e) {
                errorController.dispatch("Model " + gameModelFacade.find(this.gameModelId).getName() + " has no players.");
            }

        } else if (this.gameId != null) {                                       // If a game id is provided
            try {
                currentPlayer = playerFacade.findDebugPlayerByGameId(this.gameId);     // Select any player in that game

            } catch (WegasNoResultException e2) {
                Game g = gameFacade.find(this.gameId);
                if (g != null) {
                    errorController.dispatch("Game " + g.getName() + " has no players.");
                } else {
                    errorController.dispatch("This game could not be found.");
                }

            }
        }
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            errorController.dispatch("Team " + teamFacade.find(this.teamId).getName() + " has no player.");
        } else if (!SecurityHelper.isPermitted(currentPlayer.getGame(), "Edit")) {
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
