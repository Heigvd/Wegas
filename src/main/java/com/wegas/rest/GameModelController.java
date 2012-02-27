/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.rest;

import com.wegas.ejb.GameModelManager;
import com.wegas.persistence.game.GameModelEntity;

import com.wegas.script.ScriptManager;
import java.util.Collection;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.authz.annotation.RequiresAuthentication;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm")
public class GameModelController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    @Context
    private HttpServletRequest request;
    @EJB
    private GameModelManager gme;
    @EJB
    private ScriptManager sm;

    /**
     * Index : retrieve the game model list
     * 
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<GameModelEntity> index() {
        Collection<GameModelEntity> gameModels = gme.getGameModels();
        return gameModels;
    }

    /**
     * Retrieve a specific game model
     * @param gmID game model id
     * @return OK
     */
    @GET
    @Path("{gmID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GameModelEntity get(@PathParam("gmID") Long gmID) {
        GameModelEntity gm = gme.getGameModel(gmID);
        return gm;
    }

    /**
     * 
     * @param gm 
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameModelEntity create(GameModelEntity gm) {
        logger.log(Level.INFO, "POST GameModel");
        gme.createGameModel(gm);
        return gm;
    }

    /**
     * 
     * @param gmID
     * @param gm 
     * @return 
     */
    @PUT
    @Path("{gmID: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameModelEntity update(@PathParam("gmID") Long gmID, GameModelEntity gm) {
        return gme.updateGameModel(gmID, gm);
    }

    /**
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{gmID: [1-9][0-9]*}")
    public Response delete(@PathParam("gmID") Long gmID) {
        gme.destroyGameModel(gmID);
        return Response.noContent().build();
    }
}
