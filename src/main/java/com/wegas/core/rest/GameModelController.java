/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
public class GameModelController {

    private static final Logger logger = LoggerFactory.getLogger(GameModelController.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     * Index : retrieve the game model list
     *
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<GameModelEntity> index() {
        return gameModelFacade.findAll();
    }

    /**
     * Retrieve a specific game model
     *
     * @param entityId
     * @return OK
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractEntity get(@PathParam("entityId") Long entityId) {
        return gameModelFacade.find(entityId);
    }

    /**
     *
     * @param entity
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameModelEntity create(GameModelEntity entity) {
        logger.info("POST GameModel");
        gameModelFacade.create(entity);
        return entity;
    }

    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GameModelEntity update(@PathParam("entityId") Long entityId, GameModelEntity entity) {
        return gameModelFacade.update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GameModelEntity delete(@PathParam("entityId") Long entityId) {
        GameModelEntity entity = gameModelFacade.find(entityId);
        gameModelFacade.remove(entity);
        return entity;
    }
    /**
     *
     * @param gameModelId
     * @return
     */
    /*
     * @GET @Path("{gameModelId : [1-9][0-9]*}/Widget/")
     * @Produces(MediaType.APPLICATION_JSON) public List<WidgetEntity>
     * getWidgets(@PathParam("gameModelId") Long gameModelId) { return
     * gameModelFacade.find(gameModelId).getWidgets();
    }
     */
}
