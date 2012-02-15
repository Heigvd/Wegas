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

import com.wegas.ejb.GameManager;
import com.wegas.persistence.game.GameEntity;

import com.wegas.persistence.game.GameModelEntity;
import java.util.Collection;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm/{gameModelId : [1-9][0-9]*}/game/")
public class GameController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    /**
     * 
     */
    @EJB
    private GameManager gm;

    /**
     * Index : retrieve the game model list
     * 
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<GameEntity> index(@PathParam("gameModelId") Long gameModelId) {
        Collection<GameEntity> games = gm.getGames(gameModelId);
        return games;
    }

    /**
     * 
     * @param gm 
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameEntity create(@PathParam("gameModelId") Long gameModelId, GameEntity g) {
        gm.createGame(gameModelId, g);
        return g;
    }

    @PUT
    @Path("{gameId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameEntity update(@PathParam("gameId") Long gameId, GameEntity g) {
        return gm.updateGame(gameId, g);
    }
}
