/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import java.util.Collection;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
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
    @Inject
    private TeamFacade teamFacade;
    /**
     *
     */
    @Inject
    private GameFacade gameFacade;

    @Inject
    private RequestManager requestManager;

    /**
     *
     * @param teamId
     * @return the team
     */
    @GET
    @Path("{teamId : [1-9][0-9]*}")
    public Team get(@PathParam("teamId") Long teamId) {
        Team t = teamFacade.find(teamId);
        return t;
    }

    /**
     *
     * @param gameId
     * @return all teams in the game
     */
    @GET
    public Collection<Team> index(@PathParam("gameId") Long gameId) {
        final Game g = gameFacade.find(gameId);
        return g.getTeams();
    }

    /**
     *
     * @param gameId
     * @param entity
     * @return HTTP created containing the new team or HTTP Conflict (?)
     */
    @POST
    public Response create(@PathParam("gameId") Long gameId, Team entity) {
        Response r = Response.status(Response.Status.CONFLICT).build();
        Game g = gameFacade.find(gameId);
        if (g.getAccess() == Game.GameAccess.OPEN) {
            entity = this.teamFacade.create(gameId, entity);
            teamFacade.detach(entity);
            entity = teamFacade.find(entity.getId());
            r = Response.status(Response.Status.CREATED).entity(entity).build();
        }
        return r;
    }

    /**
     *
     * @param teamId
     * @param entity
     * @return up to date team
     */
    @PUT
    @Path("{teamId : [1-9][0-9]*}")
    public Team update(@PathParam("teamId") Long teamId, Team entity) {
        Game game = teamFacade.find(teamId).getGame();
        requestManager.assertGameTrainer(game);
        return teamFacade.update(teamId, entity);
    }

    /**
     *
     * @param teamId
     * @return just delete team
     */
    @DELETE
    @Path("{teamId: [1-9][0-9]*}")
    public Team delete(@PathParam("teamId") Long teamId) {
        Team entity = teamFacade.find(teamId);

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

        teamFacade.reset(team);
        return Response.ok().build();
    }
}
