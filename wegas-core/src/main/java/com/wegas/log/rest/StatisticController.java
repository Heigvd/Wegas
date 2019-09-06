/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.log.xapi.Xapi;
import java.io.IOException;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.LoggerFactory;

import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.inject.Inject;
import javax.ws.rs.core.Response;

/**
 * This class contains the methods used to access the Wegas statistics. It uses
 * the data of the xAPI database to create the data source of the statistics to
 * be shown on screen.
 *
 * @author Gérald Eberle
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Statistics")
@Produces(MediaType.APPLICATION_JSON)
public class StatisticController {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(StatisticController.class);

    @Inject
    private RequestManager requestManager;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject Xapi xapi;

    private List<Long> readIds(String ids) {
        if (ids != null) {
            return Arrays.stream(ids.split(",")).map(Long::valueOf).collect(Collectors.toList());
        } else {
            return new ArrayList<>();
        }
    }

    @GET
    @Path("LogId/{logid: [^/]+}/Question/{questName: [^/]+}")
    public List<Map<String, String>> showQuestion(@PathParam("logid") String logid,
            @PathParam("questName") String qName,
            @QueryParam("gid") String gameIds) throws IOException {

        return xapi.getQuestionReplies(logid, qName, readIds(gameIds));
    }

    @GET
    @Path("LogId")
    @RequiresRoles("Administrator")
    public List<String> getLogIds() {
        return xapi.getAllLogId();
    }

    /**
     * pass through to neo4j database
     *
     * @param logID
     *
     * @return Query result
     */
    @GET
    @Path("queryGames/{logid: .+}")
    @RequiresRoles("Administrator")
    public List<Long> neo4jDirectQuery(@PathParam("logid") final String logID) {
        return xapi.getAllGameIdByLogId(logID);
    }

    @GET
    @Path("Export/{logid: [^/]+}/Games/{ids: [^/]+}")
    public Response exportCSV(@PathParam("logid") String logId,
            @PathParam("ids") String gameIds,
            @QueryParam("activityPattern") String activityPattern) throws IOException {

        List<Long> ids = readIds(gameIds);
        for (Long id : ids) {
            requestManager.assertUpdateRight(gameFacade.find(id));
        }
        StringBuilder sb = xapi.exportCSV(logId, ids, ",", activityPattern);

        String filename = logId + ".csv";

        return Response.ok(sb.toString(), "text/csv")
                .header("Content-Disposition", "attachment; filename="
                        + filename).build();

    }

    @GET
    @Path("Export/{logid: [^/]+}/Teams/{ids: [^/]+}")
    public Response exportCSVByTeam(@PathParam("logid") String logId,
            @PathParam("ids") String teamIds,
            @QueryParam("activityPattern") String activityPattern) throws IOException {

        List<Long> ids = readIds(teamIds);
        for (Long id : ids) {
            requestManager.assertUpdateRight(teamFacade.find(id));
        }

        StringBuilder sb = xapi.exportCSVByTeam(logId, ids, ",", activityPattern);

        String filename = logId + ".csv";

        return Response.ok(sb.toString(), "text/csv")
                .header("Content-Disposition", "attachment; filename="
                        + filename).build();

    }
}
