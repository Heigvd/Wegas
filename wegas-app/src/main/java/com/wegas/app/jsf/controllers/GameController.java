/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.controllers.utils.HttpParam;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import java.io.IOException;
import javax.annotation.PostConstruct;
import javax.enterprise.context.RequestScoped;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.inject.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Controls player access to games
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("gameController")
@RequestScoped
public class GameController extends AbstractGameController {

    private static final long serialVersionUID = 1563759464312489408L;

    private static final Logger logger = LoggerFactory.getLogger(GameController.class);

    /**
     *
     */
    @Inject
    @HttpParam
    private Long gameId;
    /**
     *
     */
    @Inject
    @HttpParam
    private Long gameModelId;
    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;
    /**
     *
     */
    @Inject
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
                if (gameModel.isScenario() || gameModel.isModel()) {
                    // use the debug player from the debug game
                    currentPlayer = gameModel.getTestPlayer();
                } else {
                    currentPlayer = playerFacade.findPlayerInGameModel(this.gameModelId, currentUserId);

                    if (currentPlayer == null) {
                        // fallback: use a test player
                        currentPlayer = gameModel.getTestPlayer();
                    }
                }
            }
        }

        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            errorController.gameNotFound();
        } else if (currentPlayer.getStatus().equals(Status.SURVEY)) {
            errorController.accessForSurveyOnly();
        } else if (!currentPlayer.getStatus().equals(Status.LIVE)) {
            try {
                externalContext.dispatch("/wegas-app/jsf/error/waiting.xhtml");
            } catch (IOException ex) {
                logger.error("Dispatch error: {}", ex);
            }
        } else if (currentPlayer.getGame().getStatus().equals(Game.Status.DELETE)
            || currentPlayer.getGame().getStatus().equals(Game.Status.SUPPRESSED)) {
            currentPlayer = null;
            errorController.gameDeleted();
        } else if (!requestManager.hasPlayerRight(currentPlayer)) {
            currentPlayer = null;
            errorController.accessDenied();
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
