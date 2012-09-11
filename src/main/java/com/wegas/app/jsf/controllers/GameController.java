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

import com.sun.faces.util.Util;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.UserFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import java.io.IOException;
import java.io.Serializable;
import java.util.List;
import java.util.Locale;
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
@ManagedBean(name = "gameController")
@RequestScoped
public class GameController implements Serializable {

    /**
     *
     */
    @ManagedProperty(value = "#{param.id}")
    private Long playerId;
    /**
     *
     */
    @ManagedProperty(value = "#{param.gameId}")
    private Long gameId;
    /**
     *
     */
    @ManagedProperty(value = "#{param.gameModelId}")
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
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    private Player currentPlayer = null;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it
            currentPlayer = playerFacade.find(this.getPlayerId());
        } else if (this.gameModelId != null) {                                  // If we only have a gameModel id, we select the 1st player of the 1st team of the 1st game
            final GameModel gameModel = gameModelFacade.find(this.gameModelId);
            currentPlayer = gameModel.getGames().get(0).getTeams().get(0).getPlayers().get(0);
        } else if (this.gameId != null) {                                       // If we only have a gameModel id,
            try {
                currentPlayer = playerFacade.findByGameIdAndUserId(this.gameId, // we try to check if current shiro user is registered to the target game
                        userFacade.getCurrentUser().getId());
            }
            catch (Exception e) {                                               // If we still have nothing
                List<Player> players = playerFacade.findByGameId(this.gameId);
                if (!players.isEmpty()) {
                    currentPlayer = players.get(0);                             // we take the first player we find
                }
            }
        }
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            externalContext.dispatch("/wegas-app/view/error/gameerror.xhtml");
        }
    }

    public Locale calculateLocale(FacesContext context) {
        Util.notNull("context", context);
        Locale locale;

//        if (context.getViewRoot() != null) {
        locale = context.getViewRoot().getLocale();
//        }

//        if (locale != null) {
        return locale;
//        }
//        /**
//         * *******************
//         */
//        // determine the locales that are acceptable to the client based on the
//        // Accept-Language header and the find the best match among the
//        // supported locales specified by the client.
//        Iterator<Locale> locales = context.getExternalContext().getRequestLocales();
//        while (locales.hasNext()) {
//            Locale perf = locales.next();
//            locale = findMatch(context, perf);
////            if (locale != null) {
////                break;
////            }
//        }
//        // no match is found.
//        if (locale == null) {
//            if (context.getApplication().getDefaultLocale() == null) {
//                locale = Locale.getDefault();
//            } else {
//                locale = context.getApplication().getDefaultLocale();
//            }
//        }
//        return locale;
    }

    /**
     *
     * @return the game the game the current player belongs to.
     */
    public Game getCurrentGame() {
        return this.getCurrentPlayer().getTeam().getGame();
    }

    /**
     *
     * @return
     */
    public GameModel getCurrentGameModel() {
        return this.getCurrentPlayer().getTeam().getGame().getGameModel();
    }

    /**
     * @return the currentPlayer
     */
    public Player getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * @return the id
     */
    public Long getPlayerId() {
        return playerId;
    }

    /**
     * @param playerId
     */
    public void setPlayerId(final Long playerId) {
        this.playerId = playerId;
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
    public void setGameId(final Long gameId) {
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
