/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.rest;

import com.albasim.wegas.ejb.GameModelManager;
import com.albasim.wegas.ejb.TeamManager;

import com.albasim.wegas.ejb.UserManager;
import com.albasim.wegas.persistence.GameModel;
import com.albasim.wegas.persistence.TeamEntity;

import com.albasim.wegas.persistence.users.UserEntity;
import java.util.Collection;
import java.util.List;
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm/{gmID : [1-9][0-9]*}/team")
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
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<TeamEntity> index(@PathParam("gmID") String gmID) {
        GameModel gm = gmm.getGameModel(gmID);
        return gm.getTeams();
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
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public TeamEntity create(@PathParam("gmID") String gmID, TeamEntity team) {
        GameModel gm = gmm.getGameModel(gmID);
        team.setGameModel(gm);
        te.createTeam(team);
        return team;
    }

    /**
     * 
     * @param gmID
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
     * @param gmID
     * @return 
     */
    @PUT
    @Path("{teamId: [1-9][0-9]*}/addUser/{userId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public TeamEntity addUser(@PathParam("teamId") Long teamId, @PathParam("userId") Long userId) {
        return te.addUser(teamId, userId);
    }
    
    /**
     * 
     * @param gmID
     * @return 
     */
    @POST
    @Path("{teamId: [1-9][0-9]*}/   ")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public TeamEntity addUser(@PathParam("teamId") Long teamId, UserEntity u) {
        ume.createUser(u);
        return this.addUser(teamId, u.getId());
    }

    /**
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{teamId: [1-9][0-9]*}")
    public Response destroy(@PathParam("teamId") Long teamId) {
        te.destroyTeam(teamId);
        return Response.noContent().build();
    }
}
