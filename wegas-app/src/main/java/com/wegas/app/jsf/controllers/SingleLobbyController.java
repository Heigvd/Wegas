/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import java.io.IOException;
import java.io.Serializable;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.inject.Inject;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@ManagedBean(name = "singleLobbyController")
@RequestScoped
public class SingleLobbyController implements Serializable {

    /**
     *
     */
    @ManagedProperty("#{param.token}")
    private String token;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @Inject
    ErrorController errorController;
    /**
     *
     */
    private Game currentGame = null;

    /**
     *
     * @fixme rights management
     *
     */
    @PostConstruct
    public void init() {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (token != null) {
            currentGame = gameFacade.findByToken(token);
            if (currentGame != null) {                                          // 1st case: token is associated with a game
                try {
                    playerFacade.findCurrentPlayer(currentGame);
                    try {
                        externalContext.dispatch("game-play.xhtml?gameId=" + currentGame.getId());// display game page
                    } catch (IOException ex) {
                    }
                } catch (WegasNoResultException e) {
                    // Nothing to do. stay on current page so player will choose his team
                }

                //} else {                                                      // 2nd case: token is associated with a team
                //    final Team currentTeam = teamFacade.findByToken(token);
                //    if (currentTeam != null) {
                //        try {
                //            playerFacade.findCurrentPlayer(currentTeam.getGame());
                //        } catch (NoResultException etp) {                           // Player has not joined yet
                //            if (SecurityHelper.isAnyPermitted(currentTeam.getGame(), Arrays.asList("Token", "TeamToken", "View"))) {
                //                teamFacade.joinTeam(currentTeam, userFacade.getCurrentUser()); // so we join him
                //            } else {
                //                externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml"); // not allowed
                //            }
                //        }
                //        externalContext.dispatch("game-play.xhtml?gameId=" + currentTeam.getGame().getId());// display game page
                //    } else {
                //        externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml"); // no game
                //    }
                //}
            } else {
                errorController.dispatch("The game you are looking for could not be found.");
            }
        } else {
            errorController.dispatch("The game you are looking for could not be found.");
        }
    }

    /**
     * @return the token
     */
    public String getToken() {
        return token;
    }

    /**
     * @param token the token to set
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * @return the currentGame
     */
    public Game getCurrentGame() {
        return currentGame;
    }

    /**
     * @param currentGame the currentGame to set
     */
    public void setCurrentGame(Game currentGame) {
        this.currentGame = currentGame;
    }

    /**
     * @return the current game model
     */
    public GameModel getCurrentGameModel() {
        return currentGame.getGameModel();
    }
}
