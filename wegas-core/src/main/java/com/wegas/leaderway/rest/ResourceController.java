/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.rest;

import com.wegas.leaderway.ejb.ResourceFacade;
import com.wegas.leaderway.persistence.AbstractAssignement;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/ResourceDescriptor/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ResourceController {
    
    @EJB
    private ResourceFacade resourceFacade;
    
    @POST
    @Path("AbstractAssign/{resourceId : [1-9][0-9]*}")
    public void save(@PathParam("resourceId") Long resourceInstanceId, AbstractAssignement data) {
        resourceFacade.addAbstractAssignement(resourceInstanceId, data);
    }
    
    @DELETE
    @Path("AbstractRemove/{abstractAssignementId : [1-9][0-9]*}/{type}")
    public void delete(@PathParam("abstractAssignementId") Long abstractAssignementId,
                        @PathParam("type") String type) {
        resourceFacade.removeAbstractAssignement(abstractAssignementId, type);
    }
   
}
