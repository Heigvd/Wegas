/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.log.xapi.model.ProjectedStatement;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.http.HttpEntity;
import org.apache.http.HttpMessage;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Query LearningLocker ui aggregation API.
 *
 * @author maxence
 */
public class LearningLockerClient {

    public static final Logger logger = LoggerFactory.getLogger(LearningLockerClient.class);

    private String auth;
    private HttpClient client;
    private String homePage;

    private String host;

    private static final String OBJECT_ID = "statement.object.id";
    private static final String LOG_ID = "statement.context.contextActivities.category.id";

    /**
     *
     * @param host XAPI-UI endpoint (e.g. "host.tld:3000")
     * @param auth Authorization header token
     * @param sourceHomePage
     */
    public LearningLockerClient(String host, String auth, String sourceHomePage) {
        this.host = host;
        this.auth = auth;
        this.homePage = sourceHomePage;

        this.client = HttpClientBuilder.create().build();
    }

    /**
     * Consume HttpEntity from response
     *
     * @param entity
     *
     * @return
     *
     * @throws IOException
     */
    private String getEntityAsString(HttpEntity entity) throws IOException {
        if (entity != null) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            entity.writeTo(baos);
            return baos.toString("UTF-8");
        } else {
            return "";
        }
    }

    /*private Jsonb getJsonB() {
        JsonbConfig config = new JsonbConfig().withFormatting(true);
        return JsonbBuilder.create(config);
    }*/
    private ObjectMapper getObjectMapper() {
        return new ObjectMapper();
    }

    public static List l(Object... values) {
        return Arrays.stream(values).collect(Collectors.toList());
    }

    /**
     *
     * @param kvs list of key, value, key2, value2, ..., keyN, valueN
     *
     * @return a m which m keys and values from kvs
     */
    public static Map m(Object... kvs) {
        if (kvs.length % 2 > 0) {
            throw WegasErrorMessage.error("Map key/vaue set is not valid");
        }
        HashMap m = new HashMap();
        for (int i = 0; i < kvs.length; i += 2) {
            m.put(kvs[i], kvs[i + 1]);
        }
        return m;
    }

    /**
     * Convert pipeline object to query string param.
     *
     * @param pipeline
     *
     * @return
     *
     * @throws JsonProcessingException
     */
    private String getQueryString(Map<String, Object>... pipeline) throws JsonProcessingException {
        ObjectMapper mapper = getObjectMapper();
        List<NameValuePair> params = new ArrayList<>();

        List<Map<String, Object>> newPipeLine = new ArrayList<>();

        // make sure to fetch statement for correct source
        newPipeLine.add(m("$match", m("statement.actor.account.homePage", homePage)));
        newPipeLine.addAll(l((Object[]) pipeline));

        params.add(new BasicNameValuePair("pipeline", mapper.writeValueAsString(newPipeLine)));

        return "?" + URLEncodedUtils.format(params, StandardCharsets.US_ASCII);
    }

    private void setHeaders(HttpMessage msg) {
        msg.setHeader("Accept", "*/*");
        msg.setHeader("Authorization", auth);
    }

    /**
     *
     * @param pipeline
     *
     * @return
     *
     * @throws java.io.IOException
     */
    public List<Object> query(Map<String, Object>... pipeline) throws IOException {
        String url = this.host + "/api/statements/aggregate";

        url += getQueryString(pipeline);

        HttpGet get = new HttpGet(url);
        this.setHeaders(get);

        if (logger.isTraceEnabled()) {
            logger.trace("URL: {}", url);
            logger.trace("Query with pipeline: {}", getObjectMapper().writeValueAsString(pipeline));
        }

        HttpResponse response = client.execute(get);
        String json = getEntityAsString(response.getEntity());
        if (response.getStatusLine().getStatusCode() >= 400) {
            throw WegasErrorMessage.error("Failed to query LearningLocker : " + json);
        }

        logger.trace("Query Reply: {}", json);
        return getObjectMapper().readValue(json, List.class);
    }

    public static Map matchAll(Map... ands) {
        return matchAll(l((Object[]) ands));
    }

    public static Map matchAll(List<Map> ands) {
        return m("$match", and(ands));
    }

    public static Map equals(String key, Object value) {
        return m(key, value);
    }

    public static Map equals(Object key, Object value) {
        return m("$eq", l(key, value));
    }

    public static Map and(Map... ands) {
        return and(l((Object[]) ands));
    }

    public static Map and(List<Map> ands) {
        return m("$and", ands);
    }

    public static Map or(Map... ors) {
        return or(l((Object[]) ors));
    }

    public static Map or(List<Map> or) {
        return m("$or", or);
    }

    public static Map regex(String path, String pattern) {
        return m(path, m("$regex", pattern));
    }

    public static Map lastPart(Object value, String delimiter) {
        return m("$arrayElemAt",
                l(m("$split", l(value, delimiter)),
                        -1
                )
        );
    }

    public static Map elemAt(Object value, int index) {
        return m("$arrayElemAt", l(value, index)
        );
    }

    public static Map getByAnyGamesFilter(List<Long> gameIds) {
        return or(gameIds.stream()
                .map(id -> m("statement.context.contextActivities.grouping.id", "internal://wegas/game/" + id))
                .collect(Collectors.toList())
        );
    }

    public static Map getByAnyTeamsFilter(List<Long> teamIds) {
        return or(teamIds.stream()
                .map(id -> m("statement.context.contextActivities.grouping.id", "internal://wegas/team/" + id))
                .collect(Collectors.toList())
        );
    }

    public static Map projectStatemenet() {
        return m("$project", m(
                "_id", 0,
                "actor", "$statement.actor.account.name",
                "timestamp", "$statement.timestamp",
                "verb", "$statement.verb.id",
                "object_id", "$statement.object.id",
                "object_type", "$statement.object.definition.type",
                "object_desc", "$statement.object.definition.description",
                "result", "$statement.result.response",
                "success", "$statement.result.success",
                "completion", "$statement.result.completion",
                "grouping", "$statement.context.contextActivities.grouping.id"
        ));
    }

    /**
     * Return the l of logID, which have at least one statement logged for
     *
     * @return l of logID URI
     *
     * @throws IOException
     */
    public List<String> getAllLogIds() throws IOException {
        return ((List<Map<String, String>>) query(m("$project", m(
                "logId", lastPart(elemAt("$" + LOG_ID, 0), "/")
        )),
                m("$group", m(
                        "_id", "$logId"
                ))
        )).stream().map(m -> m.get("_id")).collect(Collectors.toList());
    }

    /**
     * Get the l of all games IDs
     *
     * @param logId
     *
     * @return
     *
     * @throws IOException
     */
    public List<Long> getAllGamesByLogId(String logId) throws IOException {
        return ((List<Map<String, String>>) query(matchAll(equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId)),
                m("$group", m(
                        "_id", "$statement.context.contextActivities.grouping.id"
                )),
                m("$project", m("_id", lastPart(elemAt(m("$filter",
                        m("input", "$_id",
                                "as", "item",
                                "cond", equals(m("$substrCP", l("$$item", 0, 22)),
                                        "internal://wegas/game/"
                                )
                        )
                ), 0
                ), "/")
                )),
                m("$group", m(
                        "_id", "$_id"
                ))
        )).stream().map(id -> Long.parseLong(id.get("_id"))).collect(Collectors.toList());
    }

    /**
     * All Statements
     *
     * @param logId
     * @param gameIds
     * @param activityPattern
     *
     * @return
     *
     * @throws IOException
     */
    public List<ProjectedStatement> getStatements(String logId, List<Long> gameIds, String activityPattern) throws IOException {

        List<Map> ands = l(
                equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId),
                getByAnyGamesFilter(gameIds)
        );

        if (!Helper.isNullOrEmpty(activityPattern)) {
            ands.add(regex("statement.object.id", activityPattern));
        }

        return ((List<Map<String, Object>>) query(
                matchAll(ands),
                projectStatemenet()
        )).stream().map(ProjectedStatement::new).collect(Collectors.toList());
    }

    public List<ProjectedStatement> getStatementsByTeams(String logId, List<Long> teamsIds, String activityPattern) throws IOException {
        List<Map> ands = l(
                equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId),
                getByAnyTeamsFilter(teamsIds)
        );

        if (!Helper.isNullOrEmpty(activityPattern)) {
            ands.add(regex("statement.object.id", activityPattern));
        }

        return ((List<Map<String, Object>>) query(
                matchAll(ands),
                projectStatemenet()
        )).stream().map(ProjectedStatement::new).collect(Collectors.toList());
    }

    /**
     * All question replies
     *
     * @param logId
     * @param gameIds
     * @param questionName
     *
     * @return
     *
     * @throws IOException
     */
    public List<Map<String, String>> getQuestionReplies(String logId, List<Long> gameIds, String questionName) throws IOException {
        return query(matchAll(
                equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId),
                getByAnyGamesFilter(gameIds),
                regex("statement.object.id", "act:wegas/question/" + questionName + "/choice/.*")
        ),
                m("$project", m(
                        "_id", 0,
                        "choice", lastPart("$statement.object.id", "/"),
                        "result", "$statement.result.response"
                ))
        );
    }

    public Map countResultsByActivity() {
        return m("$group",
                m("_id", "$statement.object.id",
                        "count", m("$sum", 1))
        );
    }

    public List<Map<String, Object>> getActivityCount(List<Long> gameIds) throws IOException {
        Map group = countResultsByActivity();

        if (gameIds != null && !gameIds.isEmpty()) {
            return query(
                    matchAll(
                            getByAnyGamesFilter(gameIds)
                    ),
                    group
            );
        } else {
            return query(group);
        }
    }

    public Map countResultsByTeamAndActivity() {
        // {   "$group"   : {   _id:{"group" : "$statement.context.contextActivities.grouping", "object": "$statement.object.id"}, "results": {"$push": "$statement.result"}      }  } ]   )
        return m("$group",
                m("_id", m(
                        "group", "$statement.context.contextActivities.grouping", // game & team
                        "object", "$statement.object.id", // + activity id
                        "result", "$statement.result" // + result
                ),
                        "results", m("$sum", "1") // get all results
                )
        );
    }

    public Map groupResultsByTeamAndActivity() {
        // {   "$group"   : {   _id:{"group" : "$statement.context.contextActivities.grouping", "object": "$statement.object.id"}, "results": {"$push": "$statement.result"}      }  } ]   )
        return m("$group",
                m("_id", m(
                        "group", "$statement.context.contextActivities.grouping", // game & team
                        "object", "$statement.object.id" // + activity id
                ),
                        "results", m("$push", "$statement.result") // get all results
                )
        );
    }

    public Map groupResultsByActivity() {
        return m("$group",
                m("_id", "$statement.object.id",
                        "results", m("$push", "$statement.result"))
        );
    }

    public List<Map<String, Object>> getActivityResult(List<Long> gameIds) throws IOException {
        if (gameIds != null && !gameIds.isEmpty()) {
            return query(
                    matchAll(
                            getByAnyGamesFilter(gameIds)
                    ),
                    groupResultsByActivity()
            );
        } else {
            return query(groupResultsByActivity());
        }
    }
}
