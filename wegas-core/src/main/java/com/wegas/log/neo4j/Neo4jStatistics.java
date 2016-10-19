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
import org.apache.shiro.authz.annotation.RequiresRoles;
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
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Statistics")
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
    @Path("LogId/{logid: [^/]+}/Question/{questName: [^/]+}")
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
    @Path("LogId/{logid: [^/]+}/Number/{varName : [^/]+}")
    public Object showNumber(@PathParam("logid") String logid,
                             @PathParam("varName") String vName, @QueryParam("gid") String gameIds) {
        if (!Neo4jCommunication.isDBUp()) {
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

    @GET
    @Path("LogId")
    @RequiresRoles("Administrator")
    public Object getLogIds() {
        if (!Neo4jCommunication.isDBUp()) {
            return null;
        }
        final String query = "MATCH n RETURN DISTINCT n.logID";
        final String result = Neo4jUtils.queryDBString(query);
        if (Neo4jUtils.extractErrorData(result) != null) {
            logger.warn("Warning in Neo4jStatistics.getLogIds", "Query: " + query + " has no data.");
            return null;
        }
        return Neo4jUtils.extractListData(result);
    }

    /**
     * pass through to neo4j database
     *
     * @return Query result
     */
    @POST
    @Path("query")
    @RequiresRoles("Administrator")
    public Object neo4jDirectQuery(final String query) {
        final String result = Neo4jUtils.queryDBString(query);
        final String err = Neo4jUtils.extractErrorData(result);
        if (err != null) {
            logger.warn("Warning in Neo4jStatistics.neo4jDirectQuery", "Query: " + query + " failed");
            return err;
        }
        return Neo4jUtils.extractListData(result);
    }

}
