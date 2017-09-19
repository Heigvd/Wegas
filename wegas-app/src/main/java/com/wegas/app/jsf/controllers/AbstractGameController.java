/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.sun.faces.util.Util;
import com.wegas.core.Helper;
import com.wegas.core.ejb.LibraryFacade;
import com.wegas.core.exception.internal.WegasForbiddenException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.ComboController;

import javax.ejb.EJB;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.FacesContext;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AbstractGameController implements Serializable {

    private static final long serialVersionUID = -1511995063657626077L;

    /**
     *
     */
    @ManagedProperty("#{param.id}")
    protected Long playerId;

    /**
     *
     */
    @EJB
    private ComboController comboController;

    /**
     *
     */
    @EJB
    private LibraryFacade libraryFacade;

    /**
     *
     */
    protected Player currentPlayer = null;

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

    public String getStaticClientScripts() throws IOException, WegasForbiddenException {
        String clientScriptUri = this.getCurrentGameModel().getProperties().getClientScriptUri();
        final List<String> files = new ArrayList<>();
        if (clientScriptUri != null) {
            for (String s : clientScriptUri.split(";")) {
                s = s.trim();
                s = s.startsWith("/") ? s : "/" + s;
                files.add(s);
            }
        }
        return comboController.getCombinedFile(files, ComboController.MediaTypeJs);
    }

    public String getClientScripts() {
        return libraryFacade.getLibraryContent(this.getCurrentGameModel().getId(), "ClientScript");
    }

    public String getStyleSheets() {
        return libraryFacade.getLibraryContent(this.getCurrentGameModel().getId(), "CSS");
    }

    /**
     * @return the game the game the current player belongs to.
     */
    public Game getCurrentGame() {
        return this.getCurrentPlayer().getTeam().getGame();
    }

    /**
     * @return
     */
    public GameModel getCurrentGameModel() {
        return this.getCurrentGame().getGameModel();
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

    public String getWegasProperty(String property) {
        return Helper.getWegasProperty(property);
    }
}
