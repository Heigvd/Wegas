/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
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
public class SingleLobbyController implements Serializable{
    /**
     * 
     */
    @ManagedProperty(value = "#{param.token}")
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
            try {
                currentGame = gameFacade.findByToken(token);
                try {
                    playerFacade.findCurrentPlayer(currentGame);
                    // display game page
                    externalContext.dispatch("/wegas-app/view/play.html?gameId=" + currentGame.getId());   
               } catch (PersistenceException egp) {
                    // Nothing to do. stay on current page
               }
            } catch (Exception eg){
                try {
                    currentTeam = teamFacade.findByToken(token);
                    try {
                        playerFacade.findCurrentPlayer(currentTeam.getGame());
                        // display game page
                        externalContext.dispatch("/wegas-app/view/play.html?gameId=" + currentTeam.getGame().getId());
                    } catch (PersistenceException etp){
                        // join automatically the team and display game page
                        gameController.joinTeam(currentTeam.getId());
                        externalContext.dispatch("/wegas-app/view/play.html?gameId=" + currentTeam.getGame().getId());
                    }
                } catch (PersistenceException et){
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
    public Game getCurrentGameByTocken(){
        return gameFacade.findByToken(token); 
    }
}
