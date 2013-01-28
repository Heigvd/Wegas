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

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Player;
import java.util.Collection;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/{gameId : [1-9][0-9]*}/Team/{teamId : [1-9][0-9]*}/Player")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PlayerController {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    @EJB
    private TeamFacade teamFacade;

    /**
     *
     * @param gameId
     * @param playerId
     * @return
     */
    @GET
    @Path("{playerId : [1-9][0-9]*}")
    public Player get(@PathParam("playerId") Long playerId) {
        Player p = playerFacade.find(playerId);
        SecurityUtils.getSubject().checkPermission("Game:View:g" + p.getGameId());
        return playerFacade.find(playerId);
    }

    /**
     *
     * @fixme Returns ALL players in the server ....
     *
     * @param gameId
     * @return
     */
    @GET
    public Collection<Player> index(@PathParam("gameId") Long gameId) {
        SecurityUtils.getSubject().checkPermission("Game:View:g" + gameId);
        return playerFacade.findAll();
    }

    /**
     *
     * @param gameId
     * @param entity
     * @param teamId
     * @return
     */
    @POST
    public Player create(@PathParam("teamId") Long teamId, Player entity) {
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + teamFacade.find(teamId).getGameId());
        playerFacade.create(teamId, entity);
        return entity;
    }

    /**
     *
     * @param gameId
     * @param playerId
     * @param entity
     * @return
     */
    @PUT
    @Path("{playerId: [1-9][0-9]*}")
    public Player update(@PathParam("playerId") Long playerId, Player entity) {
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + playerFacade.find(playerId).getGameId());
        return playerFacade.update(playerId, entity);
    }

    /**
     *
     * @param playerId
     * @return
     */
    @DELETE
    @Path("{playerId: [1-9][0-9]*}")
    public Player delete(@PathParam("playerId") Long playerId) {
        Player p = playerFacade.find(playerId);
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + p.getGameId());
        playerFacade.remove(playerId);
        return p;
    }
}
