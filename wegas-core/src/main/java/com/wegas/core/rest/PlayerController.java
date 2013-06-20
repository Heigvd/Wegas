/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.util.SecurityHelper;
import java.util.Collection;
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
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}/Game/{gameId : [1-9][0-9]*}/Team/{teamId : [1-9][0-9]*}/Player")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PlayerController {

    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    @EJB
    private TeamFacade teamFacade;
    @EJB
    private GameFacade gameFacade;

    /**
     *
     * @param playerId
     * @return
     */
    @GET
    @Path("{playerId : [1-9][0-9]*}")
    public Player get(@PathParam("playerId") Long playerId) {
        Player p = playerFacade.find(playerId);
        SecurityHelper.checkPermission(p.getGame(), "View");
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
        SecurityHelper.checkPermission(gameFacade.find(gameId), "View");
        return playerFacade.findAll();
    }

    /**
     *
     * @param entity
     * @param teamId
     * @return
     */
    @POST
    public Player create(@PathParam("teamId") Long teamId, Player entity) {
        SecurityHelper.checkPermission(teamFacade.find(teamId).getGame(), "Edit");
        playerFacade.create(teamId, entity);
        return entity;
    }

    /**
     *
     * @param playerId
     * @param entity
     * @return
     */
    @PUT
    @Path("{playerId: [1-9][0-9]*}")
    public Player update(@PathParam("playerId") Long playerId, Player entity) {
        SecurityHelper.checkPermission(playerFacade.find(playerId).getGame(), "Edit");
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
        SecurityHelper.checkPermission(p.getGame(), "Edit");
        playerFacade.remove(playerId);
        return p;
    }
}
