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

import com.wegas.ejb.PlayerManager;

import com.wegas.persistence.game.PlayerEntity;

import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.ws.rs.Consumes;
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
@Path("gm/{gameModelId : [1-9][0-9]*}/game/{gameId : [1-9][0-9]*}/Team/{teamId : [1-9][0-9]*}/Player")
public class PlayerController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    /**
     * 
     */
    @EJB
    private PlayerManager pm;

    /**
     * 
     * @param teamId 
     * @param team 
     * @return 
     */
    @PUT
    @Path("{playerId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PlayerEntity update(@PathParam("playerId") Long playerId, PlayerEntity player) {
        return pm.updatePlayer(playerId, player);
    }

    /**
     * 
     * @param gameModelId 
     * @param team 
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PlayerEntity create(@PathParam("teamId") Long teamId, PlayerEntity player) {
        pm.create(teamId, player);
        return player;
    }
}
