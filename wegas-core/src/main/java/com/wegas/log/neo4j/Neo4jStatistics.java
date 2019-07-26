/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.neo4j;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.neo4j.driver.v1.StatementResult;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.ejb.Stateless;

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
    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    @GET
    @Path("LogId/{logid: [^/]+}/Question/{questName: [^/]+}")
    public List<Map<String, Object>> showQuestion(@PathParam("logid") String logid,
                                                  @PathParam("questName") String qName,
                                                  @QueryParam("gid") String gameIds) {
        if (!Neo4jUtils.checkDatabaseExists()) {
            return null;
        }
        final String query = "MATCH (n) WHERE n.logID = {logID} AND n.question = {qName} AND n.gameId IN {games} RETURN n";
        List<Long> games = new ArrayList<>();
        if (gameIds != null) {
            games = (Arrays.asList(gameIds.split((",")))).stream().map(Long::valueOf).collect(Collectors.toList());
        }
        return Neo4jUtils.queryDBString(query, "logID", logid, "qName", qName, "games", games).list(r -> r.get("n").asMap());
    }

    @GET
    @Path("LogId/{logid: [^/]+}/Number/{varName : [^/]+}")
    public List<Map<String, Object>> showNumber(@PathParam("logid") String logid,
                                                @PathParam("varName") String vName,
                                                @QueryParam("gid") String gameIds) {
        if (!Neo4jUtils.checkDatabaseExists()) {
            return null;
        }
        final String query = "MATCH (n) WHERE n.logID ={logID} AND n.variable = {vName} AND n.gameId IN {games} RETURN n";
        List<Long> games = new ArrayList<>();
        if (gameIds != null) {
            games = (Arrays.asList(gameIds.split((",")))).stream().map(Long::valueOf).collect(Collectors.toList());
        }
        StatementResult result = Neo4jUtils.queryDBString(query, "logID", logid, "vName", vName, "games", games);
        return result.list(r -> r.get(("n")).asMap());
    }

    @GET
    @Path("LogId")
    @RequiresRoles("Administrator")
    public List<String> getLogIds() {
        if (!Neo4jUtils.checkDatabaseExists()) {
            return null;
        }
        final String query = "MATCH (n) RETURN DISTINCT n.logID";
        final StatementResult result = Neo4jUtils.queryDBString(query);
        return result.list(r -> r.get("n.logID").asString());
    }

    /**
     * pass through to neo4j database
     *
     * @return Query result
     */
    @GET
    @Path("queryGames/{logid: .+}")
    @RequiresRoles("Administrator")
    public List<Long> neo4jDirectQuery(@PathParam("logid") final String logID) {
        final StatementResult result = Neo4jUtils.queryDBString("MATCH (n) WHERE n.logID={logID} RETURN DISTINCT n.gameId", "logID", logID);
        return result.list(r -> r.get("n.gameId").asLong());
    }

}
