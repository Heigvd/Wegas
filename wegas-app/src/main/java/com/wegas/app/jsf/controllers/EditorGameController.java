/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.io.IOException;
import java.util.List;
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
    protected TeamFacade teamFacade;
    @Inject
    private ErrorContainer errorContainer;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.find(this.getPlayerId());

        } else if (this.getTeamId() != null) {                                       // If a playerId is provided, we use it
            try {
                currentPlayer = teamFacade.find(this.getTeamId()).getPlayers().get(0);
            } catch (ArrayIndexOutOfBoundsException ex) {
                errorContainer.setErrorMessage("Team [" + teamFacade.find(this.getTeamId()).getName() + "] has no player.");
            }

        } else if (this.getGameModelId() != null) {                                  // If we only have a gameModel id, we select the 1st player of the 1st team of the 1st game
            final GameModel gameModel = gameModelFacade.find(this.getGameModelId());
            Game game;
            Team team;
            try {
                game = gameModel.getGames().get(0);
                try {
                    team = game.getTeams().get(0);
                    try {
                        currentPlayer = team.getPlayers().get(0);
                    } catch (ArrayIndexOutOfBoundsException exc) {
                        errorContainer.setErrorMessage("Team [" + team.getName() + "] has no player.");
                    }
                } catch (ArrayIndexOutOfBoundsException e) {
                    errorContainer.setErrorMessage("Game [" + game.getName() + "] has no team.");
                }

            } catch (ArrayIndexOutOfBoundsException ex) {
                errorContainer.setErrorMessage("GameModel [" + gameModel.getName() + "] has no game.");
            }



        } else if (this.getGameId() != null) {
            try {
                currentPlayer = playerFacade.findByGameIdAndUserId(this.getGameId(),
                        userFacade.getCurrentUser().getId());   // Try to check if current shiro user is registered to the target game
            } catch (Exception e) {                                             // If we still have nothing
                List<Player> players = playerFacade.findByGameId(this.getGameId());
                if (!players.isEmpty()) {
                    currentPlayer = players.get(0);                             // we take the first player we find
                }else{
                    errorContainer.setErrorMessage("That game has no player.");
                }
            }
        }
        if (currentPlayer == null) {                                           // If no player could be found, we redirect to an error page
            externalContext.dispatch("/wegas-app/view/error.xhtml");
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
