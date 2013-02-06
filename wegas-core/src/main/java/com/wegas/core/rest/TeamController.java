/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Team;
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
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/{gameId : [1-9][0-9]*}/Team")
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

    @GET
    @Path("{teamId : [1-9][0-9]*}")
    public Team get(@PathParam("teamId") Long teamId) {
        Team t = teamFacade.find(teamId);
        SecurityUtils.getSubject().checkPermission("Game:View:g" + t.getGameId());
        return t;
    }

    @GET
    public Collection<Team> index(@PathParam("gameId") Long gameId) {
        SecurityUtils.getSubject().checkPermission("Game:View:g" + gameId);
        return gameFacade.find(gameId).getTeams();
    }

    @POST
    public Team create(@PathParam("gameId") Long gameId, Team entity) {
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + gameId);
        this.teamFacade.create(gameId, entity);
        return entity;
    }

    @PUT
    @Path("{teamId : [1-9][0-9]*}")
    public Team update(@PathParam("teamId") Long teamId, Team entity) {
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + teamFacade.find(teamId).getGameId());
        return teamFacade.update(teamId, entity);
    }

    @DELETE
    @Path("{teamId: [1-9][0-9]*}")
    public Team delete(@PathParam("teamId") Long teamId) {
        Team entity = teamFacade.find(teamId);
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + entity.getGameId());
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
