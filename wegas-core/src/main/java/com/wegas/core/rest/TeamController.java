/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.util.SecurityHelper;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TeamController {

    private static final Logger logger = LoggerFactory.getLogger(TeamController.class);
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    /**
     *
     * @param teamId
     * @return
     */
    @GET
    @Path("{teamId : [1-9][0-9]*}")
    public Team get(@PathParam("teamId") Long teamId) {
        Team t = teamFacade.find(teamId);
        SecurityHelper.checkPermission(t.getGame(), "View");
        return t;
    }

    /**
     *
     * @param gameId
     * @return
     */
    @GET
    public Collection<Team> index(@PathParam("gameId") Long gameId) {
        final Game g = gameFacade.find(gameId);
        SecurityHelper.checkPermission(g, "View");
        return g.getTeams();
    }

    /**
     *
     * @param gameId
     * @param entity
     * @return
     */
    @POST
    public Response create(@PathParam("gameId") Long gameId, Team entity) {
        Response r = Response.status(Response.Status.CONFLICT).build();
        Game g = gameFacade.find(gameId);
        if(g.getAccess() == Game.GameAccess.OPEN){
            this.teamFacade.create(gameId, entity);
            r = Response.status(Response.Status.CREATED).entity(entity).build();
        }
        return r;
    }
    
    /**
     *
     * @param teamId
     * @param entity
     * @return
     */
    @PUT
    @Path("{teamId : [1-9][0-9]*}")
    public Team update(@PathParam("teamId") Long teamId, Team entity) {
        SecurityHelper.checkPermission(teamFacade.find(teamId).getGame(), "Edit");
        return teamFacade.update(teamId, entity);
    }

    /**
     *
     * @param teamId
     * @return
     */
    @DELETE
    @Path("{teamId: [1-9][0-9]*}")
    public Team delete(@PathParam("teamId") Long teamId) {
        Team entity = teamFacade.find(teamId);

        SecurityHelper.checkPermission(entity.getGame(), "Edit");
        teamFacade.remove(entity);
        return entity;
    }

    /**
     * Resets all the variables of a given team
     *
     * @param teamId teamId
     * @return OK
     */
    @GET
    @Path("{teamId: [1-9][0-9]*}/Reset")
    public Response reset(@PathParam("teamId") Long teamId) {
        Team team = teamFacade.find(teamId);

        SecurityHelper.checkPermission(team.getGame(), "Edit");

        teamFacade.reset(team);
        return Response.ok().build();
    }
}
