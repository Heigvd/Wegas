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
     * @param host           XAPI-UI endpoint (e.g. "host.tld:3000")
     * @param auth           Authorization header token
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

    /**
     *
     * @param kvs list of key, value, key2, value2, ..., keyN, valueN
     *
     * @return a map which map keys and values from kvs
     */
    public static Map map(Object... kvs) {
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
    private String getQueryString(List<Map<String, Object>> pipeline) throws JsonProcessingException {
        ObjectMapper mapper = getObjectMapper();
        List<NameValuePair> params = new ArrayList<>();

        List<Map<String, Object>> newPipeLine = new ArrayList<>();

        // make sure to fetch statement for correct source
        newPipeLine.add(map("$match", map("statement.actor.account.homePage", homePage)));

        params.add(new BasicNameValuePair("pipeline", mapper.writeValueAsString(pipeline)));

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
    public List<Object> query(List<Map<String, Object>> pipeline) throws IOException {
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
        return matchAll(Arrays.asList(ands));
    }

    public static Map matchAll(List<Map> ands) {
        return map("$match", and(ands));
    }

    public static Map equals(String key, Object value) {
        return map(key, value);
    }

    public static Map equals(Object key, Object value) {
        return map("$eq", Arrays.asList(key, value));
    }

    public static Map and(Map... ands) {
        return and(Arrays.asList(ands));
    }

    public static Map and(List<Map> ands) {
        return map("$and", ands);
    }

    public static Map or(Map... ors) {
        return or(Arrays.asList(ors));
    }

    public static Map or(List<Map> or) {
        return map("$or", or);
    }

    public static Map regex(String path, String pattern) {
        return map(path, map("$regex", pattern));
    }

    public static Map lastPart(Object value, String delimiter) {
        return map("$arrayElemAt",
                Arrays.asList(
                        map("$split", Arrays.asList(value, delimiter)),
                        -1
                )
        );
    }

    public static Map elemAt(Object value, int index) {
        return map("$arrayElemAt", Arrays.asList(value, index)
        );
    }

    public static Map getByAnyGamesFilter(List<Long> gameIds) {
        return or(
                gameIds.stream()
                        .map(id -> map("statement.context.contextActivities.grouping.id", "internal://wegas/game/" + id))
                        .collect(Collectors.toList())
        );
    }

    public static Map getByAnyTeamsFilter(List<Long> teamIds) {
        return or(
                teamIds.stream()
                        .map(id -> map("statement.context.contextActivities.grouping.id", "internal://wegas/team/" + id))
                        .collect(Collectors.toList())
        );
    }

    public static Map projectStatemenet() {
        return map("$project", map(
                "_id", 0,
                "actor", "$statement.actor.account.name",
                "timestamp", "$statement.timestamp",
                "verb", "$statement.verb.id",
                "object_id", "$statement.object.id",
                "object_type", "$statement.object.definition.type",
                "object_desc", "$statement.object.definition.description",
                "result", "$statement.result.response",
                "grouping", "$statement.context.contextActivities.grouping.id"
        ));
    }

    /**
     * Return the list of logID, which have at least one statement logged for
     *
     * @return list of logID URI
     *
     * @throws IOException
     */
    public List<String> getAllLogIds() throws IOException {
        return ((List<Map<String, String>>) query(Arrays.asList(
                map("$project", map(
                        "logId", lastPart(elemAt("$" + LOG_ID, 0), "/")
                )),
                map("$group", map(
                        "_id", "$logId"
                ))
        ))).stream().map(m -> m.get("_id")).collect(Collectors.toList());
    }

    /**
     * Get the list of all games IDs
     *
     * @param logId
     *
     * @return
     *
     * @throws IOException
     */
    public List<Long> getAllGamesByLogId(String logId) throws IOException {
        return ((List<Map<String, String>>) query(Arrays.asList(
                matchAll(equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId)),
                map("$group", map(
                        "_id", "$statement.context.contextActivities.grouping.id"
                )),
                map("$project", map(
                        "_id", lastPart(elemAt(
                                map("$filter",
                                        map(
                                                "input", "$_id",
                                                "as", "item",
                                                "cond", equals(
                                                        map("$substrCP", Arrays.asList("$$item", 0, 22)),
                                                        "internal://wegas/game/"
                                                )
                                        )
                                ), 0
                        ), "/")
                )),
                map("$group", map(
                        "_id", "$_id"
                ))
        ))).stream().map(id -> Long.parseLong(id.get("_id"))).collect(Collectors.toList());
    }

    /**
     * All Statements
     *
     * @param logId
     * @param gameIds
     *
     * @return
     *
     * @throws IOException
     */
    public List<ProjectedStatement> getStatements(String logId, List<Long> gameIds) throws IOException {
        return ((List<Map<String, Object>>) query(
                Arrays.asList(
                        matchAll(
                                equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId),
                                getByAnyGamesFilter(gameIds)
                        ),
                        projectStatemenet()
                ))).stream().map(ProjectedStatement::new).collect(Collectors.toList());
    }

    public List<ProjectedStatement> getStatementsByTeams(String logId, List<Long> teamsIds) throws IOException {
        return ((List<Map<String, Object>>) query(
                Arrays.asList(
                        matchAll(
                                equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId),
                                getByAnyTeamsFilter(teamsIds)
                        ),
                        projectStatemenet()
                ))).stream().map(ProjectedStatement::new).collect(Collectors.toList());
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
        return query(
                Arrays.asList(
                        matchAll(
                                equals(LOG_ID, Xapi.LOG_ID_PREFIX + logId),
                                getByAnyGamesFilter(gameIds),
                                regex("statement.object.id", "act:wegas/question/" + questionName + "/choice/.*")
                        ),
                        map("$project", map(
                                "_id", 0,
                                "choice", lastPart("$statement.object.id", "/"),
                                "result", "$statement.result.response"
                        ))
                )
        );
    }
}
