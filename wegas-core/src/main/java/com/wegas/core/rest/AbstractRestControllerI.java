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

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.io.IOException;
import java.util.Collection;

/**
 * @param <T>
 * @param <U>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public interface AbstractRestControllerI<T extends AbstractFacade, U extends AbstractEntity> {

    /**
     * Index : retrieve the game model list
     *
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    Collection<U> index();

    /**
     * Retrieve a specific game model
     *
     * @param entityId
     * @return OK
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    U get(@PathParam("entityId") Long entityId);

    /**
     * @param entity
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    U create(U entity);

    /**
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    U update(@PathParam("entityId") Long entityId, U entity);

    /**
     * @param entityId
     * @return
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    U duplicate(@PathParam("entityId") Long entityId) throws IOException;

    /**
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    U delete(@PathParam("entityId") Long entityId);
}
