/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import java.io.Serializable;
import java.util.*;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class LibraryFacade implements Serializable {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @param gameModelId
     * @param name
     * @return
     */
    public Map<String, GameModelContent> findLibrary(Long gameModelId, String name) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        switch (name) {
            case "Script":
                return gameModel.getScriptLibrary();

            case "ClientScript":
                return gameModel.getClientScriptLibrary();

            case "CSS":
                return gameModel.getCssLibrary();

            default:
                throw new RuntimeException("Unable to find associated library: " + name);
        }
    }

    public String getLibraryContent(Long gameModelId, String name) {
        StringBuilder ret = new StringBuilder();
        for (GameModelContent c : this.findLibrary(gameModelId, name).values()) {
            ret.append(c.getContent().replaceAll("\\.\\./", null));
            //ret.append(c.getContent());
        }
        return ret.toString();
    }
}
