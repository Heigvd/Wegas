/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/ListDescriptor/")
public class ListDescriptorController extends AbstractRestController<VariableDescriptorFacade, ListDescriptor> {

    /**
     *
     */
    @EJB
    private VariableDescriptorFacade descriptorFacade;

    /**
     *
     * @param variableDescriptorId
     * @param entity
     * @return
     */
    @POST
    @Path("{variableDescriptorId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public ListDescriptor create(@PathParam(value = "variableDescriptorId") Long variableDescriptorId, VariableDescriptor entity) {
        return descriptorFacade.createChild(variableDescriptorId, entity);
    }

    /**
     *
     * @return
     */
    @Override
    protected VariableDescriptorFacade getFacade() {
        return this.descriptorFacade;
    }
}