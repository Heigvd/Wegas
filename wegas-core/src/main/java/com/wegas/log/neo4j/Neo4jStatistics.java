/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.log.neo4j;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 * This class contains the methods used to access the Wegas statistics. It uses
 * the data of the neo4j database to create the data source of the statistics to
 * be shown on screen.
 *
 * @author Gérald Eberle
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("Statistics/LogId/{logid: [^/]+}")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class Neo4jStatistics {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(Neo4jUtils.class);

    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    @GET
    @Path("Question/{questName: [^/]+}")
    public Object showQuestion(@PathParam("logid") String logid,
                               @PathParam("questName") String qName, @QueryParam("gid") String gameIds) {
        if (!Neo4jUtils.checkDataBaseIsRunning()) {
            return null;
        }
        String query;
        if (gameIds == null) {
            query = "MATCH (n) WHERE n.logID = \"" + logid + "\" AND n.question = \"" + qName + "\" RETURN n";
        } else {
            query = "MATCH (n) WHERE n.logID = \"" + logid + "\" AND n.question = \"" + qName + "\" AND n.gameId IN [" + gameIds + "] RETURN n";
        }
        String result = Neo4jUtils.queryDBString(query);
        if (Neo4jUtils.extractErrorData(result) != null) {
            logger.warn("Warning in Neo4jStatistics.showQuestion", "Query: " + query + " has no data.");
            return null;
        }
        return Neo4jUtils.extractListData(result);
    }

    @GET
    @Path("Number/{varName : [^/]+}")
    public Object showNumber(@PathParam("logid") String logid,
                               @PathParam("varName") String vName, @QueryParam("gid") String gameIds) {
        if (!Neo4jUtils.checkDataBaseIsRunning()) {
            return null;
        }
        String query;
        if (gameIds == null) {
            query = "MATCH (n) WHERE n.logID = \"" + logid + "\" AND n.variable = \"" + vName + "\" RETURN n";
        } else {
            query = "MATCH (n) WHERE n.logID = \"" + logid + "\" AND n.variable = \"" + vName + "\" AND n.gameId IN [" + gameIds + "] RETURN n";
        }
        String result = Neo4jUtils.queryDBString(query);
        if (Neo4jUtils.extractErrorData(result) != null) {
            logger.warn("Warning in Neo4jStatistics.showQuestion", "Query: " + query + " has no data.");
            return null;
        }
        return Neo4jUtils.extractListData(result);
    }

}
