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

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/{variableDescriptorId : [1-9][0-9]*}/VariableInstance/")
public class VariableInstanceController {

    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

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
    public VariableInstance update(@PathParam("entityId") Long entityId, VariableInstance entity) {
        
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + variableInstanceFacade.findGame(entityId).getId());
        
        return variableInstanceFacade.update(entityId, entity);
    }

    /**
     *
     * @param variableDescriptorId
     * @fixme Is this method still in use?
     *
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<VariableInstance> index(@PathParam("variableDescriptorId") Long variableDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        return vd.getScope().getVariableInstances().values();
    }

    /**
     *
     * @fixme Is this method still in use?
     *
     * @param gameModelId
     * @param variableDescriptorId
     * @param userId
     * @param newInstance
     * @return
     */
    @POST
    @Path("user/{userId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VariableInstance setVariableInstance(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("userId") Long userId,
            VariableInstance newInstance) {
        return variableInstanceFacade.update(variableDescriptorId, userId, newInstance);
    }
}