
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.AccountFacade;
import java.util.Collection;
import javax.ejb.Stateless;
import javax.inject.Inject;
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
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TeamController {

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

    @Inject
    private AccountFacade accountFacade;

    /**
     *
     * @param teamId
     *
     * @return the team
     */
    @GET
    @Path("{teamId : [1-9][0-9]*}")
    public Team get(@PathParam("teamId") Long teamId) {
        Team t = teamFacade.find(teamId);
        requestManager.setCurrentTeam(t);
        return t;
    }

    /**
     *
     * @param gameId
     *
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
     *
     * @return HTTP created containing the new team or HTTP Conflict (?)
     */
    @POST
    public Response create(@PathParam("gameId") Long gameId, Team entity) {
        Response r = Response.status(Response.Status.CONFLICT).build();
        Game g = gameFacade.find(gameId);
        if (g.getAccess() == Game.GameAccess.OPEN) {
            Team team = this.teamFacade.create(gameId, entity);
            teamFacade.detach(team);
            team = teamFacade.find(entity.getId());
            r = Response.status(Response.Status.CREATED).entity(team).build();
        }
        return r;
    }

    /**
     *
     * @param teamId
     * @param entity
     *
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
     *
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
     *
     * @return OK
     */
    @GET
    @Path("{teamId: [1-9][0-9]*}/Reset")
    public Response reset(@PathParam("teamId") Long teamId) {
        Team team = teamFacade.find(teamId);

        teamFacade.reset(team);
        return Response.ok().build();
    }

    /**
     * Invite members
     *
     * @param teamId teamId
     *
     * @return OK
     */
    @GET
    @Path("{teamId: [1-9][0-9]*}/Invite/{email: .*}")
    public Response invite(@PathParam("teamId") Long teamId,
        @PathParam("email") String email,
        @Context HttpServletRequest request
    ) {
        Team team = teamFacade.find(teamId);
        accountFacade.inviteByMail(request, email, false, null, team);
        return Response.ok().build();
    }

    /**
     * Invite player to join as guest
     *
     * @param teamId teamId
     *
     * @return OK
     */
    @GET
    @Path("{teamId: [1-9][0-9]*}/InviteAsGuest/{email: .*}")
    public Response inviteAsGuest(@PathParam("teamId") Long teamId,
        @PathParam("email") String email,
        @Context HttpServletRequest request
    ) {
        Team team = teamFacade.find(teamId);
        accountFacade.inviteByMail(request, email, true, null, team);
        return Response.ok().build();
    }
}
