/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.VariableDescriptorEntityFacade;
import com.wegas.core.ejb.VariableInstanceEntityFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.core.persistence.variableinstance.VariableInstanceEntity;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/{variableDescriptorId : [1-9][0-9]*}/VariableInstance/")
public class VariableInstanceController extends AbstractRestController<VariableInstanceEntityFacade> {

    /**
     *
     */
    @EJB
    private VariableInstanceEntityFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorEntityFacade variableDescriptorFacade;

    /**
     *
     * @return
     */
    @Override
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<AbstractEntity> index() {
        VariableDescriptorEntity vd = variableDescriptorFacade.find(this.getPathParam("variableDescriptorId"));
        return (Collection) vd.getScope().getVariableInstances().values();
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
        return variableInstanceFacade.setVariableInstanceByUserId(gameModelId, variableDescriptorId, userId, newInstance);
    }

    /**
     *
     * @return
     */
    @Override
    protected VariableInstanceEntityFacade getFacade() {
        return this.variableInstanceFacade;
    }
}