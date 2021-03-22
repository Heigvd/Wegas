
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.controllers.utils.HttpParam;
import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import javax.annotation.PostConstruct;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;

/**
 *
 * Controls player access to games
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("waitController")
@RequestScoped
public class WaitingController extends AbstractGameController {

    private static final long serialVersionUID = -2418779606634610894L;

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
     * to retrive player position in the queue
     */
    @Inject
    private PopulatorFacade populatorFacade;

    /**
     *
     */
    @Inject
    ErrorController errorController;

    @Inject
    private RequestManager requestManager;

    /**
     * Get the current user
     *
     * @return
     */
    public User getCurrentUser() {
        return userFacade.getCurrentUser();
    }

    public String getCurrentUserEmail() {
        AbstractAccount account = this.getCurrentUser().getMainAccount();
        if (account instanceof GuestJpaAccount) {
            return null;
        } else if (account != null && account.getDetails() != null) {
            return account.getDetails().getEmail();
        } else {
            return null;
        }
    }

    /**
     *
     */
    @PostConstruct
    public void init() {
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
                    currentPlayer = game.getTestPlayer();
                } else {
                    // use the player owned by the current user
                    currentPlayer = playerFacade.findPlayer(this.gameId, currentUserId);

                    if (currentPlayer == null) {
                        // fallback: use the test player
                        currentPlayer = game.getTestPlayer();
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

        if (currentPlayer == null) {
            // If no player could be found, we redirect to an error page
            errorController.gameNotFound();
        } else if (!currentPlayer.getStatus().equals(Status.LIVE)) {
            currentPlayer.setQueueSize(populatorFacade.getQueue().indexOf(currentPlayer) + 1);
        } else if (!userFacade.matchCurrentUser(currentPlayer.getId())
            && !requestManager.hasPlayerRight(currentPlayer)) {
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
