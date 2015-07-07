/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.rest;

import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.persistence.Iteration;
import java.util.Collection;
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

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Burndown/{brnDwnId : [1-9][0-9]*}/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class IterationController {

    @EJB
    private IterationFacade iterationFacade;

    /**
     * Add a new iteration to the burndownInstance
     *
     * @param burndownInstanceId the burndownInstance to add iteration in
     * @param iteration          iteration to add
     * @return the brand new iteration
     */
    @POST
    public Iteration createIteration(@PathParam("brnDwnId") Long burndownInstanceId, Iteration iteration) {
        return iterationFacade.addIteration(burndownInstanceId, iteration);
    }

    /**
     * Fetch all iteration to the burndown instance
     *
     * @param burndownInstanceId id of the burndown instance we look iterations
     *                           for
     * @return
     */
    @GET
    public Collection<Iteration> getIterations(@PathParam("brnDwnId") Long burndownInstanceId) {
        return iterationFacade.findBurndownInstance(burndownInstanceId).getIterations();
    }

    /**
     * get a specific iteration
     *
     * @param burndownInstanceId burndown owning the iteration to update
     * @param iterationId        id of iteration we look for
     * @return iteration
     */
    @GET
    @Path("{iterationId: [1-9][0-9]*}")
    public Iteration getIteration(@PathParam("brnDwnId") Long burndownInstanceId,
            @PathParam("iterationId") Long iterationId) {
        return iterationFacade.find(iterationId);
    }

    /**
     *
     * @param burndownInstanceId burndown owning the iteration to update
     * @param iterationId        id of iteration to update
     * @param iteration          iteration itself
     * @return the updated iteration
     */
    @PUT
    @Path("{iterationId : [1-9][0-9]*}")
    public Iteration updateIteration(
            @PathParam("brnDwnId") Long burndownInstanceId, @PathParam("iterationId") Long iterationId, Iteration iteration) {
        return iterationFacade.update(iterationId, iteration);
    }

    /**
     * Delete an iteration
     *
     * @param burndownInstanceId burndown owning the iteration to deleted
     * @param iterationId        id of iteration to delete
     */
    @DELETE
    @Path("{iterationId : [1-9][0-9]*}")
    public void deleteIteration(
            @PathParam("brnDwnId") Long burndownInstanceId, @PathParam("iterationId") Long iterationId) {
        iterationFacade.removeIteration(burndownInstanceId, iterationId);
    }
}
