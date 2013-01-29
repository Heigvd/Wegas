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

    /**
     *
     * @param gameId
     * @param entityId
     * @return
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public Player get(@PathParam("gameId") Long gameId,
            @PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("Game:View:g" + gameId);

        return playerFacade.find(entityId);
    }

    /**
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
    public Player create(@PathParam("gameId") Long gameId,
            @PathParam("teamId") Long teamId, Player entity) {

        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + gameId);

        playerFacade.create(teamId, entity);
        return entity;
    }

    /**
     *
     * @param gameId
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public Player update(@PathParam("gameId") Long gameId,
            @PathParam("entityId") Long entityId, Player entity) {
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + gameId);
        return playerFacade.update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public Player delete(@PathParam("entityId") Long entityId) {
        Player entity = playerFacade.find(entityId);

        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + entity.getGame().getId());

        playerFacade.remove(entity);
        return entity;
    }
}
