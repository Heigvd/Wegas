
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasConflictException;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.variable.ModelScoped;
import java.util.*;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class LibraryFacade extends WegasAbstractFacade {

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    public Map<String, GameModelContent> findLibrary(Long gameModelId, String name) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        return gameModel.getLibrariesAsMap(name);
    }

    /**
     *
     * @param gameModelId
     * @param name        library name
     *
     * @return get all content from the library identified by name
     */
    public String getLibraryContent(Long gameModelId, String name) {
        StringBuilder ret = new StringBuilder();
        Map<String, GameModelContent> libs = this.findLibrary(gameModelId, name);
        for (GameModelContent c : libs.values()) {
            ret.append(c.getContent().replaceAll("\\.\\./", ""));
            ret.append(System.lineSeparator());
            //ret.append(c.getContent());
        }
        ret.append(System.lineSeparator());
        return ret.toString();
    }

    public GameModelContent create(Long gameModelId, String libraryName, String key, GameModelContent content) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        if (gameModel.findLibrary(libraryName, key) == null) {
            content.setLibraryType(libraryName);
            content.setContentKey(key);
            gameModel.addLibrary(content);

            if (!gameModel.isModel()) {
                content.setVisibility(ModelScoped.Visibility.PRIVATE);
            }
        } else {
            throw new WegasConflictException();
        }

        return content;
    }

    public GameModelContent update(Long gameModelId, String libraryName, String key, GameModelContent content) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        GameModelContent lib = gameModel.findLibrary(libraryName, key);

        if (lib != null) {
            content.setContentKey(content.getContentKey());
            lib.merge(content);
        } else {
            throw WegasErrorMessage.error("Library does not exists");
        }
        return lib;
    }

    public void delete(Long gameModelId, String libraryName, String key) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        GameModelContent gameModelContent = gameModel.findLibrary(libraryName, key);
        if (gameModelContent != null) {
            getEntityManager().remove(gameModelContent);
            gameModel.removeLib(gameModelContent);
        }
    }
}
