/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.rest;

import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.resourceManagement.persistence.AbstractAssignement;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
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

    @POST
    @Path("Assign/{resourceId : [1-9][0-9]*}")
    public void addAssignment(@PathParam("resourceId") Long resourceInstanceId, TaskDescriptor task) {
        resourceFacade.addAbstractAssignement(resourceInstanceId, new Assignment(task));
    }

    @POST
    @Path("Reserve/{resourceId : [1-9][0-9]*}/{time : [1-9][0-9]*}")
    public void addReservation(@PathParam("resourceId") Long resourceInstanceId, @PathParam("time") double time) {
        resourceFacade.addAbstractAssignement(resourceInstanceId, new Occupation(time));
    }

    @POST
    @Path("MoveAssignment/{assignmentId : [1-9][0-9]*}/{index : [0-9]*}")
    public ResourceInstance moveAssignment(@PathParam("assignmentId") Long assignmentId, @PathParam("index") Integer index) {
        return resourceFacade.moveAssignment(assignmentId, index);
    }

    @DELETE
    @Path("RemoveAssignment/{assignmentId : [1-9][0-9]*}")
    public ResourceInstance removeAssignment(@PathParam("assignmentId") Long assignmentId) {
        return resourceFacade.removeAssignment(assignmentId);
    }

    @POST
    @Path("Plannification/{taskInstanceId : [1-9][0-9]*}/{periode : [0-9]*}")
    public TaskInstance addTaskPlannification(@PathParam("taskInstanceId") Long taskInstanceId, @PathParam("periode") Integer periode) {
        return resourceFacade.addTaskPlannification(taskInstanceId, periode);
    }

    @DELETE
    @Path("Plannification/{taskInstanceId : [1-9][0-9]*}/{periode : [0-9]*}")
    public TaskInstance removePlannification(@PathParam("taskInstanceId") Long taskInstanceId, @PathParam("periode") Integer periode) {
        return resourceFacade.removePlannification(taskInstanceId, periode);
    }
}