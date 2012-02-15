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
import com.wegas.ejb.PlayerManager;
import com.wegas.ejb.TeamManager;

import com.wegas.ejb.UserManager;
import com.wegas.persistence.game.GameModelEntity;
import com.wegas.persistence.game.PlayerEntity;
import com.wegas.persistence.game.TeamEntity;

import com.wegas.persistence.users.UserEntity;
import java.util.Collection;
import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm/{gameModelId : [1-9][0-9]*}/game/{gameId : [1-9][0-9]*}/player")
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
}
