/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.rest;

import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.persistence.Iteration;
import java.util.Collection;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
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

    @Inject
    private IterationFacade iterationFacade;

    /**
     * Fetch all iteration to the burndown instance
     *
     * @param burndownInstanceId id of the burndown instance we look iterations
     *                           for
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
            @PathParam("workload") String strWorkload){
        return iterationFacade.plan(iterationId, periodNumber, Double.parseDouble(strWorkload));
    }
}
