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
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
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
@ManagedBean(name = "gameController")
@RequestScoped
public class GameController extends AbstractGameController {

    private static final long serialVersionUID = 569534896590048360L;

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
    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private GameFacade gameFacade;
    /**
     *
     */
    @Inject
    ErrorController errorController;

    @Inject
    private RequestManager requestManager;

    /**
     *
     */
    @PostConstruct
    public void init() {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();
        long currentUserId = userFacade.getCurrentUser().getId();

        if (this.playerId != null) {
            // use the player which matches playerId
            currentPlayer = playerFacade.find(this.getPlayerId());
        }

        if (this.gameId != null) {
            Game game = gameFacade.find(this.gameId);
            if (game != null) {
                if (game instanceof DebugGame) {
                    // use the debug player
                    currentPlayer = game.getPlayers().get(0);
                } else {
                    // use the player owned by the current user
                    currentPlayer = playerFacade.findPlayer(this.gameId, currentUserId);

                    if (currentPlayer == null) {
                        // fallback: use the test player
                        for (Team t : game.getTeams()) {
                            if (t instanceof DebugTeam) {
                                currentPlayer = t.getAnyLivePlayer();
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (this.gameModelId != null) {
            GameModel gameModel = gameModelFacade.find(this.gameModelId);
            if (gameModel != null) {
                if (gameModel.getTemplate()) {
                    // use the debug player from the debug game
                    currentPlayer = gameModel.getAnyLivePlayer();
                } else {
                    currentPlayer = playerFacade.findPlayerInGameModel(this.gameModelId, currentUserId);

                    if (currentPlayer == null) {
                        // fallback: use a test player
                        for (Game g : gameModel.getGames()) {
                            for (Team t : g.getTeams()) {
                                if (t instanceof DebugTeam) {
                                    currentPlayer = t.getAnyLivePlayer();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            errorController.dispatch("The game you are looking for could not be found.");
        } else if (!currentPlayer.getStatus().equals(Status.LIVE)) {
            try {
                externalContext.dispatch("/wegas-app/jsf/error/waiting.xhtml");
            } catch (IOException ex) {
                Logger.getLogger(GameController.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else if (!currentPlayer.getGame().getStatus().equals(Game.Status.LIVE)) {
            errorController.dispatch("The game you are looking for has been deleted.");
        } else if (!requestManager.hasPlayerRight(currentPlayer)) {
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
