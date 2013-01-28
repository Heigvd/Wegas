/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.GameModel;
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
@Path("GameModel/{gameModelId : [1-9][0-9]*}/ScriptLibrary/")
public class ScriptLibrary {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @param gameModelId
     * @param script
     * @param scriptKey
     * @return p
     */
    @POST
    @Path("{scriptKey : [a-zA-Z0-9_]+}")
    @Produces(MediaType.APPLICATION_JSON)
    public GameModel edit(@PathParam("gameModelId") Long gameModelId,
            @PathParam("scriptKey") String scriptKey, String script) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        GameModel gameModel = gameModelFacade.find(gameModelId);
        gameModel.getScriptLibrary().put(scriptKey, script);
        // return Response.ok().build();
        return gameModel;
    }

    /**
     *
     * @param gameModelId
     * @param scriptKey
     * @return
     */
    @DELETE
    @Path("{scriptKey : [a-zA-Z0-9_]+}")
    @Produces(MediaType.APPLICATION_JSON)
    public GameModel delete(@PathParam("gameModelId") Long gameModelId,
            @PathParam("scriptKey") String scriptKey) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        GameModel gameModel = gameModelFacade.find(gameModelId);
        gameModel.getScriptLibrary().remove(scriptKey);
        return gameModel;
    }
}
