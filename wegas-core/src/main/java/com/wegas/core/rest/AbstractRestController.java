/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.persistence.AbstractEntity;
import java.io.IOException;
import java.util.Collection;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriInfo;

/**
 * This is f*cking useless since its only inherited once (by RoleController)
 *
 * @param <T>
 * @param <U>
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public abstract class AbstractRestController<T extends AbstractFacade<U>, U extends AbstractEntity> implements AbstractRestControllerI<T, U> {

    /**
     *
     */
    /**
     *
     */
    @Context
    protected UriInfo uriInfo;

    /**
     *
     * @return the facade this controller is designed for
     */
    protected abstract T getFacade();

    /**
     * Index: get all entities this controller is designed for
     *
     * @return all entities this controller is designed for
     */
    @GET
    @Override
    public Collection<U> index() {
        return getFacade().findAll();
    }

    /**
     * Retrieve a specific entity
     *
     * @param entityId
     * @return entity matching given id
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Override
    public U get(@PathParam("entityId") Long entityId) {
        return getFacade().find(entityId);
    }

    /**
     * Create a new entity
     *
     * @param entity
     * @return new entity
     */
    @POST
    @Override
    public U create(U entity) {
        // logger.log(Level.INFO, "POST GameModel");
        getFacade().create(entity);
        return entity;
    }

    /**
     * Update an entity
     *
     * @param entityId
     * @param entity
     * @return up to date entity
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    @Override
    public U update(@PathParam("entityId") Long entityId, U entity) {
        return getFacade().update(entityId, entity);
    }

    /**
     * Duplicate an entity
     *
     * @param entityId
     * @return entity copy
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    @Override
    public U duplicate(@PathParam("entityId") Long entityId) throws CloneNotSupportedException {
        return getFacade().duplicate(entityId);
    }

    /**
     * Delete an entity
     *
     * @param entityId id of entity to delete
     * @return the just destroyed entity
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
     * @return this controller path param
     */
    protected String getPathParam(String name) {
        return this.uriInfo.getPathParameters().get(name).get(0);
    }
}
