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
import java.io.IOException;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class VariableDescriptorController {

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
    @GET
    public Collection<VariableDescriptor> index(@PathParam("gameModelId") Long gameModelId) {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + gameModelId);

        GameModel gameModel = gameModelFacade.find(gameModelId);
        return gameModel.getChildVariableDescriptors();
    }

    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public VariableDescriptor get(@PathParam("entityId") Long entityId) {
        VariableDescriptor vd = variableDescriptorFacade.find(entityId);

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + vd.getGameModelId());

        return vd;
    }

    @POST
    public VariableDescriptor create(@PathParam("gameModelId") Long gameModelId,
            VariableDescriptor entity) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        this.variableDescriptorFacade.create(gameModelId, entity);
        return entity;
    }

    /**
     *
     * @param variableDescriptorId
     * @param entity
     * @return
     */
    @POST
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    public ListDescriptor createChild(@PathParam("entityId") Long entityId, VariableDescriptor entity) {

        SecurityUtils.getSubject().
                checkPermission("GameModel:Edit:gm" + variableDescriptorFacade.find(entityId).getGameModelId());

        return variableDescriptorFacade.createChild(entityId, entity);
    }

    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public VariableDescriptor update(@PathParam("entityId") Long entityId, VariableDescriptor entity) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + variableDescriptorFacade.find(entityId).getGameModelId());

        return variableDescriptorFacade.update(entityId, entity);
    }

    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    public VariableDescriptor duplicate(@PathParam("entityId") Long entityId) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + variableDescriptorFacade.find(entityId).getGameModelId());

        return variableDescriptorFacade.duplicate(entityId);
    }

    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public VariableDescriptor delete(@PathParam("entityId") Long entityId) {
        VariableDescriptor entity = variableDescriptorFacade.find(entityId);

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + entity.getGameModelId());

        variableDescriptorFacade.remove(entityId);
        return entity;
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

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        gameModelFacade.reset(gameModelId);
        return Response.ok().build();
    }
}
