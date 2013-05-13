/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
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
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
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
    public VariableInstance update(@PathParam("entityId") Long entityId, VariableInstance entity) {

        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + variableInstanceFacade.findGame(entityId).getId());

        return variableInstanceFacade.update(entityId, entity);
    }

    /**
     *
     * @param variableDescriptorId @fixme Is this method still in use?
     *
     * @return
     */
    @GET
    public Collection<VariableInstance> index(@PathParam("variableDescriptorId") Long variableDescriptorId) {
 
        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        
        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + vd.getGameModelId());
        
        return vd.getScope().getVariableInstances().values();
    }
    
    /**
     *
     * @param variableInstanceId
     *
     * @return
     */
    @GET
    @Path("{variableInstanceId: [1-9][0-9]*}")
    public VariableInstance get(@PathParam("variableDescriptorId") Long variableDescriptorId, @PathParam("variableInstanceId") Long variableInstanceId) {
        VariableInstance vi = variableInstanceFacade.find(variableInstanceId);
        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + vi.getDescriptor().getGameModelId());
        if (!vi.getDescriptorId().equals(variableDescriptorId)){
            return null;
        }
        
        return vi;  
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
    public VariableInstance setVariableInstance(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("userId") Long userId,
            VariableInstance newInstance) {
        return variableInstanceFacade.update(variableDescriptorId, userId, newInstance);
    }
}