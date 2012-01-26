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

import com.albasim.wegas.ejb.GameModelManager;
import com.albasim.wegas.ejb.VariableDescriptorManager;
import com.albasim.wegas.persistence.GameModelEntity;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import java.util.Collection;


import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm/{gameModelId : [1-9][0-9]*}/vardesc")
public class VariableDescriptorController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_VariableDescriptor");
    @EJB
    private GameModelManager gmm;
    @EJB
    private VariableDescriptorManager vdm;

    /**
     * 
     * @param gameModelId
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<VariableDescriptorEntity> index(
            @PathParam("gameModelId") Long gameModelId) {
        GameModelEntity theGameModel = gmm.getGameModel(gameModelId);
        //  return AlbaHelper.getIndex(theGameModel.getVariableDescriptors());
        return theGameModel.getVariableDescriptors();
    }

    /**
     * Retrieve the list of game model variable descriptor
     *   To fetch complex type varDes see gm/x/type/y/var_desc
     * @param gameModelId game model id
     * @param variableDescriptorId 
     * @return OK
     */
    @GET
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public VariableDescriptorEntity get(@PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId) {
        return vdm.getVariableDescriptor(variableDescriptorId);
    }

    /**
     * Create a global variable descriptor
     * 
     * @param gameModelId 
     * @param variableDescriptor 
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VariableDescriptorEntity create(
            @PathParam("gameModelId") Long gameModelId,
            VariableDescriptorEntity variableDescriptor) {

        vdm.create(gameModelId, variableDescriptor);

        return variableDescriptor;
    }

    /**
     * @param gameModelId
     * @param variableDescriptorId 
     * @param variableDescriptor 
     * @return 
     */
    @PUT
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VariableDescriptorEntity update(@PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            VariableDescriptorEntity variableDescriptor) {

        return vdm.update(variableDescriptorId, variableDescriptor);
    }

    /**
     * 
     * @param gameModelId
     * @param variableDescriptorId 
     * @return 
     */
    @DELETE
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    public Response destroy(@PathParam("gameModelId") String gameModelId,
            @PathParam("variableDescriptorId") String variableDescriptorId) {

        vdm.destroyVariableDescriptor(gameModelId, variableDescriptorId);

        return Response.status(Response.Status.OK).build();
    }
}
