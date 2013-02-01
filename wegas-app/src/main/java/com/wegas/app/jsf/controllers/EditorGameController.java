/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import java.io.IOException;
import java.util.List;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
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
    @ManagedProperty("#{param.teamId}")
    protected Long teamId;
    /**
     *
     */
    @EJB
    protected TeamFacade teamFacade;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.find(this.getPlayerId());

        } else if (this.teamId != null) {                                       // If a playerId is provided, we use it
            currentPlayer = teamFacade.find(this.teamId).getPlayers().get(0);

        } else if (this.gameModelId != null) {                                  // If we only have a gameModel id, we select the 1st player of the 1st team of the 1st game
            final GameModel gameModel = gameModelFacade.find(this.gameModelId);
            currentPlayer = gameModel.getGames().get(0).getTeams().get(0).getPlayers().get(0);

        } else if (this.gameId != null) {
            try {
                currentPlayer = playerFacade.findByGameIdAndUserId(this.gameId,
                        userFacade.getCurrentUser().getId());   // Try to check if current shiro user is registered to the target game
            } catch (Exception e) {                                             // If we still have nothing
                List<Player> players = playerFacade.findByGameId(this.gameId);
                if (!players.isEmpty()) {
                    currentPlayer = players.get(0);                             // we take the first player we find
                }
            }
        }

        try {
            SecurityUtils.getSubject().checkPermission("Game:Edit:g" + currentPlayer.getGame().getId());
        } catch (UnauthorizedException e) {
            externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml");
        }

        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            externalContext.dispatch("/wegas-app/view/error/gameerror.xhtml");
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
}
