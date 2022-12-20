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
import java.util.Collection;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * @param <T>
 * @param <U>
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public interface AbstractRestControllerI<T extends AbstractFacade, U extends AbstractEntity> {

    /**
     * Index: get all entities this controller is designed for
     *
     * @return all entities this controller is designed for
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    Collection<U> index();

    /**
     * Retrieve a specific entity
     *
     * @param entityId
     * @return entity matching given id
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    U get(@PathParam("entityId") Long entityId);

    /**
     * Create a new entity
     *
     * @param entity
     * @return new entity
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    U create(U entity);

    /**
     * Update an entity
     *
     * @param entityId
     * @param entity
     * @return up to date entity
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    U update(@PathParam("entityId") Long entityId, U entity);

    /**
     * Duplicate an entity
     *
     * @param entityId
     * @return entity copy
     * @throws java.lang.CloneNotSupportedException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    U duplicate(@PathParam("entityId") Long entityId) throws CloneNotSupportedException;

    /**
     * Delete an entity
     *
     * @param entityId id of entity to delete
     * @return the just destroyed entity
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    U delete(@PathParam("entityId") Long entityId);
}
