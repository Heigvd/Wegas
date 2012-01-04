/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.rest;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.ejb.Dispatcher;
import com.albasim.wegas.ejb.GameModelManager;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GameModel;

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

/**
 *
 * @author maxence
 */
@Stateless
@Path("gm")
public class GameModelController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");


    @Context
    private HttpServletRequest request;


    @EJB
    private Dispatcher dispatcher;


    @EJB
    private GameModelManager gme;


    /**
     * Index : retrieve the game model list
     * 
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index() {
        Collection<IndexEntry> gameModels = gme.getGameModels();
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
    public GameModel get(@PathParam("gmID") String gmID) {
        Terminal terminal = dispatcher.getTerminal(request);
        GameModel gm = gme.getGameModel(gmID, terminal);
        return gm;
    }


    /**
     * 
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameModel create(GameModel gm) {
        logger.log(Level.INFO, "POST GameModel");
        Terminal terminal = dispatcher.getTerminal(request);
        gme.createGameModel(gm, terminal);
        return gm;
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @PUT
    @Path("{gmID: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameModel update(@PathParam("gmID") String gmID, GameModel gm) {
        Terminal terminal = dispatcher.getTerminal(request);
        return gme.updateGameModel(gmID, gm, terminal);
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{gmID: [1-9][0-9]*}")
    public Response destroy(@PathParam("gmID") String gmID) {
        Terminal terminal = dispatcher.getTerminal(request);
        gme.destroyGameModel(gmID, terminal);
        return Response.noContent().build();
    }


    @GET
    @Path("detach")
    public Response detachAll() {
        Terminal terminal = dispatcher.getTerminal(request);
        gme.detachAll(terminal);
        return Response.noContent().build();
    }


    @GET
    @Path("{gmID: [1-9][0-9]*}/detach")
    public Response detach(@PathParam("gmID") String gmID) {
        GameModel gameModel = gme.getGameModel(gmID, null);

        Terminal terminal = dispatcher.getTerminal(request);
        gme.detachGameModel(gameModel, terminal);
        return Response.noContent().build();
    }


}
