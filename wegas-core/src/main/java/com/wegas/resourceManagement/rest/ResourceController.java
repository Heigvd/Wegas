/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.rest;

import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.resourceManagement.persistence.ResourceInstance;
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

    /**
     *
     * @param resourceInstanceId
     * @param taskDescriptorId
     */
    @POST
    @Path("Assign/{resourceId : [1-9][0-9]*}/{taskDescriptorId : [1-9][0-9]*}")
    public void addAssignment(
        @PathParam("resourceId") Long resourceInstanceId,
        @PathParam("taskDescriptorId") Long taskDescriptorId
    ) {
        resourceFacade.assign(resourceInstanceId, taskDescriptorId);
    }

    /**
     *
     * @param assignmentId
     * @param index
     * @return
     */
    @POST
    @Path("Assign/{assignmentId : [1-9][0-9]*}/{index : [0-9]*}")
    public ResourceInstance moveAssignment(@PathParam("assignmentId") Long assignmentId, @PathParam("index") Integer index) {
        return resourceFacade.moveAssignment(assignmentId, index);
    }

    /**
     *
     * @param assignmentId
     * @return
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
    public void addReservation(@PathParam("resourceId") Long resourceInstanceId, @PathParam("time") double time) {
        resourceFacade.addOccupation(resourceInstanceId, true, time);
    }

    /**
     *
     * @param occupationId
     *
     */
    @DELETE
    @Path("Reserve/{occupationId : [1-9][0-9]*}/{type}")
    public void deleteReservation(@PathParam("occupationId") Long occupationId) {
        resourceFacade.removeOccupation(occupationId);
    }

    /**
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     * @return
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
     * @return
     */
    @DELETE
    @Path("Player/{playerId : [1-9][0-9]*}/Plan/{taskInstanceId : [1-9][0-9]*}/{periode : [0-9]*}")
    public TaskInstance unplan(@PathParam("playerId") Long playerId, @PathParam("taskInstanceId") Long taskInstanceId,
        @PathParam("periode") Integer period) {
        return resourceFacade.unplan(playerId, taskInstanceId, period);
    }
}
