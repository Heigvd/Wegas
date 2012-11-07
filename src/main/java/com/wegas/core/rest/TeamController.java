/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Team;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/{gameId : [1-9][0-9]*}/Team")
public class TeamController extends AbstractRestController<TeamFacade, Team> {

    private static final Logger logger = LoggerFactory.getLogger(TeamController.class);
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;

    /**
     *
     * @return
     */
    @Override
    protected TeamFacade getFacade() {
        return this.teamFacade;
    }

    @Override
    public Team create(Team entity) {
        this.teamFacade.create(new Long(this.getPathParam("gameId")),
                (Team) entity);
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
