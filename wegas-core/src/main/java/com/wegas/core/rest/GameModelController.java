/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.GameModel;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class GameModelController {

    private static final Logger logger = LoggerFactory.getLogger(GameModelController.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @Inject
    private RequestManager requestManager;

    /**
     *
     * @param gm
     * @return
     */
    @POST
    public GameModel create(GameModel gm) {
        // logger.info(Level.INFO, "POST GameModel");
        Subject s = SecurityUtils.getSubject();
        s.checkPermission("GameModel:Create");

        gameModelFacade.create(gm);
        return gm;
    }

    /**
     *
     * @param entityId
     * @return
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public GameModel get(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + entityId);

        return gameModelFacade.find(entityId);
    }

    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public GameModel update(@PathParam("entityId") Long entityId, GameModel entity) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + entityId);

        return gameModelFacade.update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    public GameModel duplicate(@PathParam("entityId") Long entityId) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Duplicate:gm" + entityId);

        return gameModelFacade.duplicate(entityId);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public GameModel delete(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("GameModel:Delete:gm" + entityId);

        GameModel entity = gameModelFacade.find(entityId);
        gameModelFacade.remove(entityId);
        return entity;
    }

    /**
     *
     * @return
     */
    @GET
    public Collection<GameModel> index() {

        Collection<GameModel> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();
        //String r =  (requestManager.getView() == Views.Index.class) ? "View": "Edit";

        for (GameModel g : gameModelFacade.findAll()) {
            //if (s.isPermitted("GameModel:" + r +":gm" + aGm.getId())) {
            if (s.isPermitted("GameModel:View:gm" + g.getId())) {
                games.add(g);
            }
        }
        return games;
    }
    
    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Publish")
    public GameModel publish(@PathParam("entityId") Long entityId) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + entityId);

        return gameModelFacade.publish(entityId);
    }
}
