/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.security.ejb.UserFacade;
import java.io.IOException;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.find(this.getPlayerId());

        } else if (this.teamId != null) {                                       // If a team id is provided
            try {
                currentPlayer = teamFacade.find(this.teamId).getPlayers().get(0); // Return the first player

            } catch (ArrayIndexOutOfBoundsException ex) {
                errorController.setErrorMessage("Team " + teamFacade.find(this.teamId).getName() + " has no player.");

            }

        } else if (this.gameModelId != null) {                                  // If we only have a gameModel id
            try {
                currentPlayer = playerFacade.findByGameModelId(this.gameModelId);// Select any player in this game model

            } catch (PersistenceException e) {
                errorController.setErrorMessage("Game model " + gameModelFacade.find(this.gameModelId).getName() + " has no players.");

            }

        } else if (this.gameId != null) {                                       // If a game id is provided
            try {
                currentPlayer = playerFacade.findByGameIdAndUserId(this.gameId,
                        userFacade.getCurrentUser().getId());               // Try to check if current shiro user is registered to the target game

            } catch (PersistenceException e) {                                     // If we still have nothing

                try {
                    currentPlayer = playerFacade.findByGameId(this.gameId);     // Select any player in that game

                } catch (PersistenceException e2) {
                    errorController.setErrorMessage("Game " + gameFacade.find(this.gameId).getName() + " has no players.");

                }
            }
        }
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            externalContext.dispatch("/wegas-app/view/error/error.xhtml");
        } else {

            try {
                SecurityUtils.getSubject().checkPermission("Game:Edit:g" + currentPlayer.getGame().getId());
            } catch (UnauthorizedException e) {
                externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml");
            }
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
