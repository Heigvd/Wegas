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
@Path("gm/{gameModelId : [1-9][0-9]*}/game/{gameId : [1-9][0-9]*}/Team")
public class TeamController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    @EJB
    private TeamManager te;
    @EJB
    private GameModelManager gmm;
    @EJB
    private UserManager ume;

    /**
     * 
     * @param gameModelId 
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<TeamEntity> index(@PathParam("gameModelId") Long gameModelId) {
        GameModelEntity gm = gmm.getGameModel(gameModelId);
//        return gm.getTeams();
        return null;
    }

    /**
     * @param teamId teamId id
     * @return team
     */
    @GET
    @Path("{teamId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public TeamEntity get(@PathParam("teamId") Long teamId) {
        TeamEntity team = te.getTeam(teamId);
        return team;
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
    public TeamEntity create(@PathParam("gameId") Long gameId, TeamEntity team) {
        te.createTeam(gameId, team);
        return team;
    }

    /**
     * 
     * @param teamId 
     * @param team 
     * @return 
     */
    @PUT
    @Path("{teamId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public TeamEntity update(@PathParam("teamId") Long teamId, TeamEntity team) {
        return te.updateTeam(teamId, team);
    }

    /**
     * 
     * @param teamId 
     * @param userId 
     * @return 
     */
  /*  @PUT
    @Path("{teamId: [1-9][0-9]*}/addUser/{userId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PlayerEntity addUser(@PathParam("teamId") Long teamId, @PathParam("userId") Long userId) {
        return te.createPlayer(teamId, userId);
    }*/

    /**
     * 
     * @param teamId 
     * @param u 
     * @return 
     */
  /*  @POST
    @Path("{teamId: [1-9][0-9]*}/   ")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public TeamEntity addUser(@PathParam("teamId") Long teamId, UserEntity u) {
        ume.createUser(u);
        return this.addUser(teamId, u.getId());
    }*/

    /**
     * 
     * @param teamId 
     * @return 
     */
    @DELETE
    @Path("{teamId: [1-9][0-9]*}")
    public Response destroy(@PathParam("teamId") Long teamId) {
        te.destroyTeam(teamId);
        return Response.noContent().build();
    }
}
