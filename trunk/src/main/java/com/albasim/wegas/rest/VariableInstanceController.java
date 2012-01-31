/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.rest;

import com.albasim.wegas.ejb.VariableDescriptorManager;
import com.albasim.wegas.ejb.VariableInstanceManager;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;

import java.util.Collection;
import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm/{gameModelId : [1-9][0-9]*}/vardesc/{variableDescriptorId : [1-9][0-9]*}/varinst/")
public class VariableInstanceController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_VariableInstance");
    @EJB
    private VariableDescriptorManager vdm;
    @EJB
    private VariableInstanceManager vim;

    /**
     * 
     * @param gmID
     * @param variableDescriptorId
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<VariableInstanceEntity> index(
            @PathParam("gmID") Long gmID,
            @PathParam("variableDescriptorId") Long variableDescriptorId ) {
        VariableDescriptorEntity vd = vdm.getVariableDescriptor(variableDescriptorId);
        return vd.getScope().getVariableInstances().values();
    }

    /**
     * 
     * @param gameModelId
     * @param variableDescriptorId
     * @param variableInstanceId
     * @return
     */
    @GET
    @Path("{variableInstanceId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VariableInstanceEntity get(@PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("variableInstanceId") Long variableInstanceId) {

        return vim.getVariableInstance(variableInstanceId);
    }
    
    /**
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
    public VariableInstanceEntity setVariableInstance(@PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("userId") Long userId,
            VariableInstanceEntity newInstance) {

        return vim.setVariableInstanceByUserId(gameModelId, variableDescriptorId, userId, newInstance);
    }
    
    /**
     * 
     * @param gameModelId
     * @param variableDescriptorId
     * @param variableInstanceId
     * @param newInstance
     * @return
     */
    @PUT
    @Path("{variableInstanceId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VariableInstanceEntity update(@PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("variableInstanceId") Long variableInstanceId,
            VariableInstanceEntity newInstance) {

        return vim.update(variableInstanceId, newInstance);
    }
}