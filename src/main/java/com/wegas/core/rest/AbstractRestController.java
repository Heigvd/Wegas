/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.persistence.AbstractEntity;
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public abstract class AbstractRestController<T extends AbstractFacade> {

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
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<AbstractEntity> index() {
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
    //@JsonView(Views.Export.class)
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractEntity get(@PathParam("entityId") Long entityId) {
        return getFacade().find(entityId);
    }

    /**
     *
     * @param entity
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractEntity create(AbstractEntity entity) {
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
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractEntity update(@PathParam("entityId") Long entityId, AbstractEntity entity) {
        return getFacade().update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public AbstractEntity delete(@PathParam("entityId") Long entityId) {
        AbstractEntity entity = getFacade().find(entityId);
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
