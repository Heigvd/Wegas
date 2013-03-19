/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Library/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class Library {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @param gameModelId
     * @param script
     * @param key
     * @return p
     */
    @POST
    @Path("{library:.*}/{key : [a-zA-Z0-9_]+}")
    public GameModel edit(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key, GameModelContent script) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        this.findLibrary(gameModelId, library).put(key, script);
        // return Response.ok().build();
        return gameModelFacade.find(gameModelId);
    }

    /**
     *
     * @param gameModelId
     * @param key
     * @return
     */
    @DELETE
    @Path("{library:.*}/{key : [a-zA-Z0-9_]+}")
    public GameModel delete(@PathParam("gameModelId") Long gameModelId,
            @PathParam("library") String library,
            @PathParam("key") String key) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        this.findLibrary(gameModelId, library).remove(key);
        // return Response.ok().build();
        return gameModelFacade.find(gameModelId);
    }

    /**
     *
     * @param gameModelId
     * @param name
     * @return
     */
    private Map findLibrary(Long gameModelId, String name) {
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
}
