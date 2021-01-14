/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.controllers.utils.HttpParam;
import com.wegas.core.Helper;
import com.wegas.core.ejb.LibraryFacade;
import com.wegas.core.exception.internal.WegasForbiddenException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.util.BlacklistFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.servlet.ServletContext;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AbstractGameController implements Serializable {

    private static final long serialVersionUID = -1511995063657626077L;
    private static final Logger logger = LoggerFactory.getLogger(AbstractGameController.class);

    final static public String MediaTypeCss = "text/css; charset=UTF-8";
    final static public String MediaTypeJs = "application/javascript; charset=UTF-8";

    /**
     *
     */
    @Inject @HttpParam("id")
    protected Long playerId;

    /**
     *
     */
    @Inject
    private LibraryFacade libraryFacade;

    /**
     *
     */
    protected Player currentPlayer = null;

//    public Locale calculateLocale(FacesContext context) {
//        Util.notNull("context", context);
//        Locale locale;

//        if (context.getViewRoot() != null) {
//        locale = context.getViewRoot().getLocale();
//        }

//        if (locale != null) {
//        return locale;
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
//    }

    public String getCombinedFile(List<String> fileList, String mediaType) throws IOException, WegasForbiddenException {
        StringBuilder acc = new StringBuilder();
        ServletContext context = (ServletContext) FacesContext.getCurrentInstance().getExternalContext().getContext();

        for (String fileName : fileList) {
            if (BlacklistFilter.isBlacklisted(fileName)) {
                throw new WegasForbiddenException("Trying to access a blacklisted content");
            }
            try {
                InputStream fis = context.getResourceAsStream(fileName);
                String content = IOUtils.toString(fis, Helper.getWegasProperty("encoding"));
                //String content = new Scanner(fis, Helper.getWegasProperty("encoding"))
                //.useDelimiter("\\A").next();                                  // Use a fake delimiter to read all lines at once

                if (mediaType.equals(MediaTypeCss)) {                     // @hack for css files, we correct the path
                    String dir = fileName.substring(0, fileName.lastIndexOf('/') + 1);
                    content = content.replaceAll("url\\(\"?\'?([^:\\)\"\']+)\"?\'?\\)",
                            "url(" + context.getContextPath()
                            + dir + "$1)");                                     //Regexp to avoid rewriting protocol guess they contain ':' (http: data:)
                }
                acc.append(content).append('\n');
            } catch (NullPointerException e) {
                logger.error("Resource not found : {}", fileName);
            }
        }
        return acc.toString();
    }



    public String getStaticClientScripts() throws IOException, WegasForbiddenException {
        String clientScriptUri = this.getCurrentGameModel().getProperties().getClientScriptUri();
        final List<String> files = new ArrayList<>();
        if (!Helper.isNullOrEmpty(clientScriptUri)) {
            for (String s : clientScriptUri.split(";")) {
                s = s.trim();
                s = s.startsWith("/") ? s : "/" + s;
                files.add(s);
            }
        }
        return this.getCombinedFile(files, MediaTypeJs);
    }

    public String getClientScripts() {
        return libraryFacade.getLibraryContent(this.getCurrentGameModel().getId(), "ClientScript");
    }

    /**
     * Get all style-sheets defined in the current gameModel CSS library concatenated within a single string
     *
     * @return
     */
    public String getCombinedStyleSheet() {
        return libraryFacade.getLibraryContent(this.getCurrentGameModel().getId(), "CSS");
    }

    /**
     * @return the game the game the current player belongs to.
     */
    public Game getCurrentGame() {
        return this.getCurrentPlayer().getTeam().getGame();
    }

    /**
     * @return the gameModel linked to the currentGame
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

    public void dispatch(String view) {
        try {
            FacesContext.getCurrentInstance().getExternalContext().dispatch(view);
        } catch (IOException ex) {
            logger.error("Unable to find error page", ex);
        }
    }
}
