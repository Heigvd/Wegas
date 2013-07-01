/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}/Game/{gameId : [1-9][0-9]*}/Team")
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
    public Team create(@PathParam("gameId") Long gameId, Team entity) {
        SecurityHelper.checkPermission(gameFacade.find(gameId), "Edit");
        this.teamFacade.create(gameId, entity);
        return entity;
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
     *
     * @param teamId
     * @param userId
     * @return
     */
    /*
     * @PUT @Path("{teamId: [1-9][0-9]*}/addUser/{userId: [1-9][0-9]*}")
     * @Consumes(MediaType.APPLICATION_JSON)
     * @Produces(MediaType.APPLICATION_JSON) public PlayerEntity
     * addUser(@PathParam("teamId") Long teamId, @PathParam("userId") Long
     * userId) { // return TeamFacadeBean.joinTeam(teamId, userId); return null;
     * }
     */
    /**
     *
     * @param teamId
     * @param u
     * @return
     */
    /*
     * @POST @Path("{teamId: [1-9][0-9]*}/ ")
     * @Consumes(MediaType.APPLICATION_JSON)
     * @Produces(MediaType.APPLICATION_JSON) public Team
     * addUser(@PathParam("teamId") Long teamId, UserEntity u) {
     * ume.createUser(u); return this.addUser(teamId, u.getId()); }
     */
}
