/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import org.apache.shiro.SecurityUtils;

/**
 *
 * Controls player access to games
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@ManagedBean(name = "waitController")
@RequestScoped
public class WaitingController extends AbstractGameController {

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
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     * to retrive player position in the queue
     */
    @Inject
    private PopulatorFacade populatorFacade;

    /**
     *
     */
    @Inject
    ErrorController errorController;

    /**
     * Get the current user
     * 
     * @return 
     */
    public User getCurrentUser(){
        return userFacade.getCurrentUser();
    }


    public String getCurrentUserEmail(){
        return this.getCurrentUser().getMainAccount().getEmail();
    }

    /**
     *
     */
    @PostConstruct
    public void init() {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.findLive(this.getPlayerId());
            if (currentPlayer == null) {
                currentPlayer = playerFacade.findTestPlayer(this.getPlayerId());
                if (currentPlayer != null
                        && !SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + this.gameModelId)) {
                    currentPlayer = null;
                }
            }
        }

        if (this.gameId != null) {                                              // If a gameId is provided, we use it
            try {
                currentPlayer = playerFacade.findByGameIdAndUserId(this.gameId,
                        userFacade.getCurrentUser().getId());                   // Try to check if current shiro user is registered to the target game

            } catch (WegasNoResultException | WegasNotFoundException e) {                                     // If we still have nothing
                errorController.dispatch("You are not registered to this game.");
                return;
            }
        }

        if (this.gameModelId != null) {
            GameModel find = gameModelFacade.find(this.gameModelId);
            if (find != null && find.getTemplate() && SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + this.gameModelId)) {
                currentPlayer = find.getGames().get(0).getTeams().get(0).getPlayers().get(0);
            }
        }

        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            errorController.dispatch("The game you are looking for could not be found.");
        } else if (!currentPlayer.getStatus().equals(Status.LIVE)) {
            currentPlayer.setQueueSize(populatorFacade.getQueue().indexOf(currentPlayer) + 1);
        } else if (!userFacade.matchCurrentUser(currentPlayer.getId())
                && !SecurityUtils.getSubject().isPermitted("Game:View:g" + currentPlayer.getGame().getId())) {
            try {
                externalContext.dispatch("/wegas-app/jsf/error/accessdenied.xhtml");
            } catch (IOException ex) {
            }
        }
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
