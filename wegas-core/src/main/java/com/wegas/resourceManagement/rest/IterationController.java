/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.rest;

import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.persistence.Iteration;
import java.util.Collection;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Burndown/{brnDwnId : [1-9][0-9]*}/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class IterationController {

    @Inject
    private IterationFacade iterationFacade;

    /**
     * Fetch all iteration to the burndown instance
     *
     * @param burndownInstanceId id of the burndown instance we look iterations for
     *
     * @return all iterations contained within the given burndown instance
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
     *
     * @return iteration
     */
    @GET
    @Path("{iterationId: [1-9][0-9]*}")
    public Iteration getIteration(@PathParam("brnDwnId") Long burndownInstanceId,
        @PathParam("iterationId") Long iterationId) {
        return iterationFacade.find(iterationId);
    }

    @PUT
    @Path("{iterationId: [1-9][0-9]*}/Plan/{period: [0-9]+}/{workload}")
    public Iteration plan(@PathParam("brnDwnId") Long burndownInstanceId,
        @PathParam("iterationId") Long iterationId,
        @PathParam("period") Long periodNumber,
        @PathParam("workload") String strWorkload) {
        return iterationFacade.plan(iterationId, periodNumber, Double.parseDouble(strWorkload));
    }

    @PUT
    @Path("{iterationId: [1-9][0-9]*}/Replan/{period: [0-9]+}/{workload}")
    public Iteration replan(@PathParam("brnDwnId") Long burndownInstanceId,
        @PathParam("iterationId") Long iterationId,
        @PathParam("period") Long periodNumber,
        @PathParam("workload") String strWorkload) {
        return iterationFacade.replan(iterationId, periodNumber, Double.parseDouble(strWorkload));
    }
}
