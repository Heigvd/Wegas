/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.LibraryFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import java.util.Map;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.shiro.authz.AuthorizationException;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Library/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LibraryController {

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @Inject
    private LibraryFacade libraryFacade;

    /**
     *
     * @param gameModelId
     * @param library
     *
     * @return all gameModel given library entries
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @GET
    @Path("{library}")
    public Map get(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library) {

        return libraryFacade.findLibrary(gameModelId, library);
    }

    /**
     *
     * @param gameModelId id of the library owner
     * @param library     type of library
     * @param key         library filename
     *
     * @return up to date library entry content
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @GET
    @Path("{library}/{key : [a-zA-Z0-9_/]+}")
    public GameModelContent read(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key) {

        return libraryFacade.findLibrary(gameModelId, library).get(key);
    }

    /**
     * Update existing library
     *
     * @param gameModelId id of the library owner
     * @param library     type of library
     * @param script      content
     * @param key         library filename
     *
     * @return game model with the new library entry
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @PUT
    @Path("{library}/{key : [a-zA-Z0-9_/]+}")
    public GameModelContent edit(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key, GameModelContent script) {

        return libraryFacade.update(gameModelId, library, key, script);
    }

    /**
     * Create a new file. The new filename may contains alphanumeric characters, '_' and '/'.
     * Slashes are used to mimic folders,
     *
     * @param gameModelId id of the library owner
     * @param library     type of library
     * @param script      content
     * @param key         library filename
     *
     * @return game model with the new library entry
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @POST
    @Path("{library}/{key : [a-zA-Z0-9_/]+}")
    public GameModelContent create(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key, GameModelContent script) {

        return libraryFacade.create(gameModelId, library, key, script);
    }

    /**
     *
     * @param gameModelId
     * @param library
     * @param key
     *
     * @return gameModel with up to date library
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @DELETE
    @Path("{library}/{key : [a-zA-Z0-9_/]+}")
    public GameModel delete(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key) {

        libraryFacade.delete(gameModelId, library, key);
        // return Response.ok().build();
        return gameModelFacade.find(gameModelId);
    }
}
