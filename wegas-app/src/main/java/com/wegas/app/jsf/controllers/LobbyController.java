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

import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.GameModel;
import java.io.IOException;
import javax.annotation.PostConstruct;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import org.apache.shiro.SecurityUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "gameController")
@RequestScoped
public class GameController extends AbstractGameController {

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
           
            currentPlayer = playerFacade.find(this.getPlayerId());
            if (currentPlayer == null){
                externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml");
            } else if (!userFacade.matchCurrentUser(currentPlayer.getId())) {
                externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml");
            }
            
            SecurityUtils.getSubject().checkPermission("Game:View:g" + currentPlayer.getGame().getId());
            
        } else if (this.gameModelId != null) {                                  // If we only have a gameModel id, we select the 1st player of the 1st team of the 1st game
            
            final GameModel gameModel = gameModelFacade.find(this.gameModelId);
            currentPlayer = gameModel.getGames().get(0).getTeams().get(0).getPlayers().get(0);
        
        } else if (this.gameId != null) {                                       // If we only have a gameModel id,
            
//            SecurityUtils.getSubject().checkPermission("Game:View:g" + this.gameId);
            
            try {
                currentPlayer = playerFacade.findByGameIdAndUserId(this.gameId, // we try to check if current shiro user is registered to the target game
                        userFacade.getCurrentUser().getId());
            
            } catch (PersistenceException e) {                                               // If we still have nothing                //Cas 1 player lobby
                externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml");
            }
        }
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            externalContext.dispatch("/wegas-app/view/error/gameerror.xhtml");
        }
    }
}
