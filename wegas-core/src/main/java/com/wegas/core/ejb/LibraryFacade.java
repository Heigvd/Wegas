/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.variable.ModelScoped;
import java.util.*;
import java.util.stream.Collectors;
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

    /**
     * Check if a folder already exists.
     * To check if such a folder exists,
     *
     * @param gameModel lib owner
     * @param libType   lib type
     * @param path      path to check
     *
     * @return true if there the folder already exists
     */
    private boolean doesFolderExist(GameModel gameModel, String libType, String path) {
        if (path == null) {
            // root always exists
            return true;
        }

        Optional<GameModelContent> exists = gameModel.getLibrariesAsList(libType)
            .stream()
            .filter(lib -> {
                return lib.getContentKey().startsWith(path);
            })
            .findFirst();

        return exists.isPresent();
    }

    public GameModelContent create(Long gameModelId, String libraryType, String pathArg, GameModelContent content) {
        // make sure path does not start with a slash.
        String path = Helper.cleanFilename(pathArg);

        String pathToTest = path + '/'; // make sure pathToTest ends with a slash

        GameModel gameModel = gameModelFacade.find(gameModelId);
        if (gameModel.findLibrary(libraryType, path) == null) {
            if (doesFolderExist(gameModel, libraryType, pathToTest)) {
                // e.f new path is /hello, but /hello/world already exists
                throw WegasErrorMessage.error("Folder already exists", "GameModelContent.Create.FolderAlreadyExists");
            }
            List<String> allPaths = Helper.getAllPaths(path);

            allPaths.forEach(p -> {
                if (gameModel.findLibrary(libraryType, p) != null) {
                    // e.f new path is /hello/world, but /hello already exists and /hello is not a folder
                    throw WegasErrorMessage.error("Folder already exists", "GameModelContent.Create.FolderAlreadyExists");
                }
            });

            content.setLibraryType(libraryType);
            content.setContentKey(path);
            gameModel.addLibrary(content);

            if (!gameModel.isModel()) {
                content.setVisibility(ModelScoped.Visibility.PRIVATE);
            }
        } else {
            throw WegasErrorMessage.error("Library already exists", "GameModelContent.Create.AlreadyExists");
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
            throw WegasErrorMessage.error("Library does not exist", "GameModelContent.Update.DoesNotExist");
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
