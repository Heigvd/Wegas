/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.io.IOException;
import java.io.Serializable;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;

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
    private com.wegas.core.rest.GameController gameController;
    /**
     *
     */
    private Game currentGame = null;
    /**
     *
     */
    private Team currentTeam = null;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (token != null) {
            currentGame = gameFacade.findByToken(token);
            if (currentGame != null) {
                try {
                    // display game page
                    externalContext.dispatch("/wegas-app/view/play.html?id=" + playerFacade.findCurrentPlayer(currentGame).getId());
                } catch (PersistenceException e) {
                    // Nothing to do. stay on current page
                }

            } else {
                currentTeam = teamFacade.findByToken(token);
                if (currentTeam != null) {
                    try {
                        playerFacade.findCurrentPlayer(currentTeam.getGame());
                    } catch (PersistenceException etp) {
                        gameController.joinTeam(currentTeam.getId());           // Player has not joined yet, force join
                    }
                    externalContext.dispatch("/wegas-app/view/play.html?id="
                            + playerFacade.findCurrentPlayer(currentTeam.getGame()).getId());// display game page

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
     *
     * @return
     */
    public Game getCurrentGameByTocken() {
        return gameFacade.findByToken(this.token);
    }
}
