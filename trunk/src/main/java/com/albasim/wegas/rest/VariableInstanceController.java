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

import com.albasim.wegas.ejb.WegasEntityManager;
import com.albasim.wegas.ejb.UserManager;
import com.albasim.wegas.ejb.VariableDescriptorManager;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.scope.ScopeEntity;


import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author maxence
 */
@Stateless
@Path("gm/{gameModelId : [1-9][0-9]*}/vardesc/{variableDescriptorId : [1-9][0-9]*}/varinst/")
public class VariableInstanceController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_VariableInstance");


    @EJB
    private WegasEntityManager wem;
    
    @EJB
    private VariableDescriptorManager vdm;    
    
    @EJB
    private UserManager um;

    @POST
    @Path("user/{userId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VariableInstanceEntity createInstance(@PathParam("gameModelId") Long gameModelId,
                                     @PathParam("variableDescriptorId") Long variableDescriptorId,
                                     @PathParam("userId") Long userId,
                                     VariableInstanceEntity newInstance) {
        ScopeEntity s = vdm.getVariableDescriptor(variableDescriptorId).getScope();
        s.setVariableInstance(um.getUser(userId), newInstance);
        wem.update(s);
        return newInstance;
    }
    

}