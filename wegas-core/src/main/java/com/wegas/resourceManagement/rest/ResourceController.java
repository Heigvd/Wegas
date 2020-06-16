/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.rest;

import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskInstance;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/ResourceDescriptor/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ResourceController {

    @Inject
    private ResourceFacade resourceFacade;

    /**
     * Assign a resource to a task
     *
     * @param resourceInstanceId
     * @param taskInstanceId
     */
    @POST
    @Path("Assign/{resourceInstanceId : [1-9][0-9]*}/{taskInstanceId : [1-9][0-9]*}")
    public void addAssignment(
            @PathParam("resourceInstanceId") Long resourceInstanceId,
            @PathParam("taskInstanceId") Long taskInstanceId
    ) {
        resourceFacade.assign(resourceInstanceId, taskInstanceId);
    }

    /**
     * Change assignment priority
     *
     * @param assignmentId
     * @param index
     * @return the resourceInstance with up to date assignment order
     */
    @PUT
    @Path("MoveAssignment/{assignmentId : [1-9][0-9]*}/{index : [0-9]*}")
    public ResourceInstance moveAssignment(@PathParam("assignmentId") Long assignmentId, @PathParam("index") Integer index) {
        return resourceFacade.moveAssignment(assignmentId, index);
    }

    /**
     * Unassign a resource from a task
     *
     * @param assignmentId
     * @return the resourceInstance with up to date assignments
     */
    @DELETE
    @Path("Assign/{assignmentId : [1-9][0-9]*}")
    public ResourceInstance removeAssignment(@PathParam("assignmentId") Long assignmentId) {
        return resourceFacade.removeAssignment(assignmentId);
    }

    /**
     *
     * @param resourceInstanceId
     * @param time
     */
    @POST
    @Path("Reserve/{resourceId : [1-9][0-9]*}/{time : [1-9][0-9]*}")
    public void addReservation(@PathParam("resourceId") Long resourceInstanceId, @PathParam("time") Integer time) {
        resourceFacade.addOccupation(resourceInstanceId, true, time);
    }

    /**
     *
     * @param occupationId
     *
     */
    @DELETE
    @Path("Reserve/{occupationId : [1-9][0-9]*}")
    public void deleteReservation(@PathParam("occupationId") Long occupationId) {
        resourceFacade.removeOccupation(occupationId);
    }

    /**
     * Plan a task to be worked on at the given period number
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     * @return TaskInstance with new planning
     */
    @POST
    @Path("Player/{playerId : [1-9][0-9]*}/Plan/{taskInstanceId : [1-9][0-9]*}/{period : [0-9]*}")
    public TaskInstance plan(@PathParam("playerId") Long playerId, @PathParam("taskInstanceId") Long taskInstanceId,
            @PathParam("period") Integer period) {
        return resourceFacade.plan(playerId, taskInstanceId, period);
    }

    /**
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     * @return TaskInstance with new planning
     */
    @DELETE
    @Path("Player/{playerId : [1-9][0-9]*}/Plan/{taskInstanceId : [1-9][0-9]*}/{periode : [0-9]*}")
    public TaskInstance unplan(@PathParam("playerId") Long playerId, @PathParam("taskInstanceId") Long taskInstanceId,
            @PathParam("periode") Integer period) {
        return resourceFacade.unplan(playerId, taskInstanceId, period);
    }
}
