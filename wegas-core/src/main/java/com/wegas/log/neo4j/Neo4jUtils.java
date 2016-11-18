/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.log.neo4j;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.wegas.core.Helper;
import org.apache.commons.lang3.StringEscapeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.ProcessingException;
import javax.ws.rs.client.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.Iterator;

/**
 * This class contains the methods used to access the neo4j database. It uses
 * the REST interface of the neo4j database to create, update or delete nodes
 * and relations between the nodes.
 *
 * @author Gérald Eberle
 * @author Cyril Junod (cyril.junod at gmail.com)
 */

class Neo4jUtils {

    private static final String NEO4J_SERVER_URL = Helper.getWegasProperty("neo4j.server.url", "");

    private static final String NEO4J_BASIC_AUTH = Helper.getWegasProperty("neo4j.server.auth", "");

    private static final Logger logger = LoggerFactory.getLogger(Neo4jUtils.class);

    private static final Client client = ClientBuilder.newClient();

    private static final ObjectMapper objectMapper;


    static {
        objectMapper = new ObjectMapper();
        objectMapper.configure(JsonGenerator.Feature.QUOTE_FIELD_NAMES, false);
        objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
    }

    /**
     * Checks if the neo4j database is running. If not, it is not necessary to
     * continue.
     *
     * @return true if the neo4j database is running, false otherwise
     */
    static boolean checkDataBaseIsRunning() {
        if (NEO4J_SERVER_URL.isEmpty()) {
            return false;
        }
        try {
            Response response = getBuilder(NEO4J_SERVER_URL).get();
            int status = response.getStatus();
            response.close();
            return status == 200;
        } catch (ProcessingException ex) {
            return false;
        }
    }

    /**
     * Sends a given query to the neo4j database and gets a response. The
     * response is received as a string containing JSON format data.
     *
     * @param query the query to be submitted
     * @return a string containing the query's answer
     */
    static String queryDBString(String query) {
        final String qURL = NEO4J_SERVER_URL + "transaction/commit";
        String entity = "{ \"statements\" : [ { \"statement\" : \"" + StringEscapeUtils.escapeJson(query) + "\" } ] }";
        String result = null;
        Response response = getBuilder(qURL).post(Entity.json(entity));
        if (checkValidHttpResponse(response.getStatus())) {
            result = response.readEntity(String.class);
        }
        response.close();
        return result;
    }

    /**
     * Extracts from the JSON result of a query the potential error message.
     * If no message is found null is returned.
     *
     * @param result the result of the query
     * @return the error message if an error occurred, null otherwise
     */
    static String extractErrorData(String result) {
        ObjectMapper om = new ObjectMapper();
        try {
            JsonNode jn = om.readTree(result);
            JsonNode jnErr = jn.path("errors");
            Iterator<JsonNode> ite1 = jnErr.elements();
            String err = "";
            while (ite1.hasNext()) {
                JsonNode jn1 = ite1.next();
                err += ", " + jn1.path("message").asText();
            }
            if ("".equals(err)) return null;
            return err.substring(2);
        } catch (IOException ioe) {
            logger.debug("Error in extractErrorData: " + ioe.getMessage());
        }
        return null;
    }

    /**
     * Extracts the data part from the JSON result of a query. The data is
     * returned as a list of string(s). If no data was found, an empty list is
     * returned.
     *
     * @param result the result of a query
     * @return the data list as a Json object
     */
    static ArrayNode extractListData(String result) {
        ArrayNode on = objectMapper.createArrayNode();
        ObjectMapper om = new ObjectMapper();
        try {
            JsonNode jn = om.readTree(result);
            JsonNode jnRes = jn.path("results");
            Iterator<JsonNode> ite1 = jnRes.elements();
            while (ite1.hasNext()) {
                JsonNode jn1 = ite1.next();
                JsonNode jnDat = jn1.path("data");
                Iterator<JsonNode> ite2 = jnDat.elements();
                while (ite2.hasNext()) {
                    JsonNode jn2 = ite2.next();
                    JsonNode jnRow = jn2.path("row");
                    Iterator<JsonNode> ite3 = jnRow.elements();
                    while (ite3.hasNext()) {
                        JsonNode jn3 = ite3.next();
                        on.add(jn3);
                    }
                }
            }
        } catch (IOException ioe) {
            logger.debug("Error in extractListData: " + ioe.getMessage());
        }
        return on;
    }

    private static Invocation.Builder getBuilder(String URL) {
        WebTarget target = client.target(URL);
        if (Helper.isNullOrEmpty(NEO4J_BASIC_AUTH)) {
            return target.request().accept(MediaType.APPLICATION_JSON);
        } else {
            return target.request().accept(MediaType.APPLICATION_JSON).header("Authorization", "Basic " + NEO4J_BASIC_AUTH);
        }

    }
    /**
     * Checks the http status code. The successful operations return a status
     * code between 200 and 299.
     *
     * @param status the status code to be tested
     * @return true if the status code means success, false otherwise
     */
    private static boolean checkValidHttpResponse(int status) {
        return ((status >= 200) && (status < 300));
    }
}
