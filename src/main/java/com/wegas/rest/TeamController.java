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

import com.wegas.ejb.TeamEntityFacade;
import com.wegas.persistence.game.PlayerEntity;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/{gameId : [1-9][0-9]*}/Team")
public class TeamController extends AbstractRestController<TeamEntityFacade> {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    /**
     *
     */
    @EJB
    private TeamEntityFacade teamFacade;

    /**
     * 
     * @return
     */
    @Override
    protected TeamEntityFacade getFacade() {
        return this.teamFacade;
    }
    
    /**
     * 
     * @param teamId 
     * @param userId 
     * @return 
     */
    @PUT
    @Path("{teamId: [1-9][0-9]*}/addUser/{userId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PlayerEntity addUser(@PathParam("teamId") Long teamId, @PathParam("userId") Long userId) {
       // return TeamEntityFacade.createPlayer(teamId, userId);
        return null;
    }

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
}
