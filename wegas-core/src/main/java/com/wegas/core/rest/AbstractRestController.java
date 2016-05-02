/*
 * Wegas
 *
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.persistence.AbstractEntity;
import java.io.IOException;
import java.util.Collection;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @param <T>
 * @param <U>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public abstract class AbstractRestController<T extends AbstractFacade<U>, U extends AbstractEntity> implements AbstractRestControllerI<T, U> {

    private static final Logger logger = LoggerFactory.getLogger(AbstractRestController.class);
    /**
     *
     */
    @Context
    protected UriInfo uriInfo;

    /**
     *
     * @return
     */
    protected abstract T getFacade();

    /**
     * Index : retrieve the game model list
     *
     * @return
     */
    @GET
    @Override
    public Collection<U> index() {
        return getFacade().findAll();
    }

    /**
     * Retrieve a specific game model
     *
     * @param entityId
     * @return OK
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public U get(@PathParam("entityId") Long entityId) {
        return getFacade().find(entityId);
    }

    /**
     *
     * @param entity
     * @return
     */
    @POST
    @Override
    public U create(U entity) {
        // logger.log(Level.INFO, "POST GameModel");
        getFacade().create(entity);
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
    @Override
    public U update(@PathParam("entityId") Long entityId, U entity) {
        return getFacade().update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    @Override
    public U duplicate(@PathParam("entityId") Long entityId) throws IOException {
        return getFacade().duplicate(entityId);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @Override
    public U delete(@PathParam("entityId") Long entityId) {
        U entity = getFacade().find(entityId);
        getFacade().remove(entity);
        return entity;
    }

    /**
     *
     * @param name
     * @return
     */
    protected String getPathParam(String name) {
        return this.uriInfo.getPathParameters().get(name).get(0);
    }
}
