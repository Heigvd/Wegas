/*
 * Wegas
 *
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.persistence.AbstractEntity;
import java.io.IOException;
import java.util.Collection;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 *
 * @param <T>
 * @param <U>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract interface AbstractRestControllerI<T extends AbstractFacade, U extends AbstractEntity> {

    /**
     * Index : retrieve the game model list
     *
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<U> index();

    /**
     * Retrieve a specific game model
     *
     * @param entityId
     * @return OK
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public U get(@PathParam("entityId") Long entityId);

    /**
     *
     * @param entity
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public U create(U entity);

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
    public U update(@PathParam("entityId") Long entityId, U entity);

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public U duplicate(@PathParam("entityId") Long entityId) throws IOException;

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public U delete(@PathParam("entityId") Long entityId);
}
