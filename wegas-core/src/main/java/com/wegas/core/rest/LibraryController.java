/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.LibraryFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
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
    @EJB
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @EJB
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
    @Path("{library:.*}")
    public Map get(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library) {

        return libraryFacade.findLibrary(gameModelId, library);
    }

    /**
     *
     * @param gameModelId
     * @param library
     * @param key
     *
     * @return up to date library entry content
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @GET
    @Path("{library:.*}/{key : [a-zA-Z0-9_]+}")
    public String read(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key) {

        return libraryFacade.findLibrary(gameModelId, library).get(key).getContent();
    }

    /**
     *
     * @param gameModelId
     * @param library
     * @param script
     * @param key
     *
     * @return game model with the new library entry
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @PUT
    @Path("{library:.*}/{key : [a-zA-Z0-9_]+}")
    public GameModel edit(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key, GameModelContent script) {

        libraryFacade.update(gameModelId, library, key, script);

        return gameModelFacade.find(gameModelId);
    }

    /**
     *
     * @param gameModelId
     * @param library
     * @param script
     * @param key
     *
     * @return game model with the new library entry
     *
     * @throws AuthorizationException current user doesn't have access to the
     *                                gameModel
     */
    @POST
    @Path("{library:.*}/{key : [a-zA-Z0-9_]+}")
    public GameModel create(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key, GameModelContent script) {

        libraryFacade.create(gameModelId, library, key, script);
        // return Response.ok().build();
        return gameModelFacade.find(gameModelId);
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
    @Path("{library:.*}/{key : [a-zA-Z0-9_]+}")
    public GameModel delete(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key) {

        libraryFacade.delete(gameModelId, library, key);
        // return Response.ok().build();
        return gameModelFacade.find(gameModelId);
    }
}
