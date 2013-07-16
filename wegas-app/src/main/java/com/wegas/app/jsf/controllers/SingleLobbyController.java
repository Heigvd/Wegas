/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.NoResultException;
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import java.io.IOException;
import java.io.Serializable;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import org.apache.shiro.SecurityUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
    @EJB
    private TeamFacade teamFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    private Game currentGame = null;

    /**
     *
     * @fixme rights management
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (token != null) {
            currentGame = gameFacade.findByToken(token);
            if (currentGame != null) {                                          // 1st case: token is associated with a game
                try {
                    playerFacade.findCurrentPlayer(currentGame);
                    externalContext.dispatch("/wegas-app/view/play.xhtml?gameId=" + currentGame.getId());// display game page
                } catch (PersistenceException e) {
                    // Nothing to do. stay on current page so player will choose his team
                }

            } else {                                                            // 2nd case: token is associated with a team
                final Team currentTeam = teamFacade.findByToken(token);
                if (currentTeam != null) {
                    try {
                        playerFacade.findCurrentPlayer(currentTeam.getGame());
                    } catch (NoResultException etp) {                           // Player has not joined yet
                        if (SecurityUtils.getSubject().isPermitted("Game:Token:g" + currentTeam.getGame().getId())) {
                            teamFacade.joinTeam(currentTeam, userFacade.getCurrentUser()); // so we join him
                        } else {
                            externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml"); // not allowed
                        }
                    }
                    externalContext.dispatch(
                            "/wegas-app/view/play.xhtml?gameId=" + currentTeam.getGame().getId());// display game page
                } else {
                    externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml"); // no game
                }
            }

        } else {
            externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml"); // no game
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
}
