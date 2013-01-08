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

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor")
public class VariableDescriptorController extends AbstractRestController<VariableDescriptorFacade, VariableDescriptor> {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorController.class);
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @return
     */
    @Override
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<VariableDescriptor> index() {
        Long gameModelId = this.getGameModelId();
        GameModel gameModel = gameModelFacade.find(gameModelId);
        return gameModel.getChildVariableDescriptors();
    }

    @Override
    public VariableDescriptor create(VariableDescriptor entity) {
        this.variableDescriptorFacade.create(new Long(this.getPathParam("gameModelId")),
                entity);
        return entity;
    }

    @POST
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public ListDescriptor createChild(@PathParam(value = "variableDescriptorId") Long variableDescriptorId, VariableDescriptor entity) {
        return variableDescriptorFacade.createChild(variableDescriptorId, entity);
    }

    /**
     * Resets all the variables of a given game model
     *
     * @param gameModelId game model id
     * @return OK
     */
    @GET
    @Path("Reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Response reset(@PathParam("gameModelId") Long gameModelId) {
        gameModelFacade.reset(gameModelId);
        return Response.ok().build();
    }

    private Long getGameModelId() {
        return new Long(this.getPathParam("gameModelId"));
    }

    /**
     *
     * @return
     */
    @Override
    protected VariableDescriptorFacade getFacade() {
        return this.variableDescriptorFacade;
    }
}
