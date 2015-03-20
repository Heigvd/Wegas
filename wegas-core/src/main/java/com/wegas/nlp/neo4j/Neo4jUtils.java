/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.nlp.neo4j;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonNode;
import com.fasterxml.jackson.core.map.ObjectMapper;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.Stateless;
import javax.ws.rs.core.MediaType;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Iterator;

/**
 * This class contains the methods used to access the neo4j database. It uses
 * the REST interface of the neo4j database to create, update or delete nodes
 * and relations between the nodes.
 *
 * @author Gérald Eberle
 */

@Stateless
public class Neo4jUtils {

    private static final String NEO4J_SERVER_URL = "http://localhost:7474/db/data/";

    private static final Logger logger = LoggerFactory.getLogger(Neo4jUtils.class);

    /**
     * Checks if the neo4j database is running. If not, it is not necessary to
     * continue.
     *
     * @return true if the neo4j database is running, false otherwise
     */
    protected static boolean checkDataBaseIsRunning() {
        WebResource resource = Client.create().resource(NEO4J_SERVER_URL);
        ClientResponse response = resource.get(ClientResponse.class);
        int status = response.getStatus();
        response.close();
        return status == 200;
    }

    /**
     * Creates a node without any label or property.
     *
     * @return the URI of the newly created node
     */
    protected static URI createNode() {
        final String nodeURL = NEO4J_SERVER_URL + "node";
        WebResource resource = Client.create().resource(nodeURL);
        ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                .type(MediaType.APPLICATION_JSON).entity("{}")
                .post(ClientResponse.class);
        final URI nodeURI = response.getLocation();
        response.close();
        return nodeURI;
    }

    /**
     * Adds a label to the given node.
     *
     * @param nodeURI the node URI
     * @param lValue  the label of the node
     */
    protected static void addNodeLabel(URI nodeURI, String lValue) {
        final String labURL = nodeURI.toString() + "/labels";
        String entity = "\"" + lValue + "\"";
        WebResource resource = Client.create().resource(labURL);
        ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                .type(MediaType.APPLICATION_JSON).entity(entity)
                .post(ClientResponse.class);
        response.close();
    }

    /**
     * Adds a string property to the given node.
     *
     * @param nodeURI the node URI
     * @param pName   the property name to be added
     * @param pValue  the property value to be added
     */
    protected static void addNodeProperty(URI nodeURI, String pName, String pValue) {
        final String propURL = nodeURI.toString() + "/properties/" + pName;
        String entity = "\"" + pValue + "\"";
        WebResource resource = Client.create().resource(propURL);
        ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                .type(MediaType.APPLICATION_JSON).entity(entity)
                .put(ClientResponse.class);
        response.close();
    }

    /**
     * Adds a integer (long) property to the given node.
     *
     * @param nodeURI the node URI
     * @param pName   the property name to be added
     * @param pValue  The property value to be added
     */
    protected static void addNodeProperty(URI nodeURI, String pName, Long pValue) {
        final String propURL = nodeURI.toString() + "/properties/" + pName;
        String entity = Long.toString(pValue);
        WebResource resource = Client.create().resource(propURL);
        ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                .type(MediaType.APPLICATION_JSON).entity(entity)
                .put(ClientResponse.class);
        response.close();
    }

    /**
     * Creates a relationship with a direction beween two nodes.
     *
     * @param sNode   the start node URI for the relationship
     * @param eNode   the end node URI for the relationship
     * @param rType   the relation type
     * @param attribs the set of the attributes of the relationship
     * @return the URI of the new relationship
     */
    protected static URI createRelation(URI sNode, URI eNode, String rType,
                                        String... attribs) {
        final String relURL = sNode.toString() + "/relationships";
        String entity = createJsonRelation(eNode, rType, attribs);
        if (entity != null) {
            WebResource resource = Client.create().resource(relURL);
            ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                    .type(MediaType.APPLICATION_JSON).entity(entity)
                    .post(ClientResponse.class);
            final URI relURI = response.getLocation();
            response.close();
            return relURI;
        }
        return null;
    }

    /**
     * Adds properties as metadata to a given relationship.
     *
     * @param rUri   the relationship URI
     * @param pName  the name of the property
     * @param pValue the value of the property
     */
    protected static void addRelationMetadata(URI rUri, String pName, String pValue) {
        final String relURL = rUri.toString() + "/properties";
        String entity = String.format("{ \"%s\" : \"%s\" }", pName, pValue);
        WebResource resource = Client.create().resource(relURL);
        ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                .type(MediaType.APPLICATION_JSON).entity(entity)
                .put(ClientResponse.class);
        response.close();
    }

    /**
     * Sends a given query to the neo4j database and gets a response. The
     * response is received as a string containing JSON format data.
     *
     * @param query the query to be submitted
     * @return a string containing the query's answer
     */
    protected static String queryDBString(String query) {
        final String qURL = NEO4J_SERVER_URL + "transaction/commit";
        String entity = "{ \"statements\" : [ { \"statement\" : \"" + query + "\" } ] }";
        WebResource resource = Client.create().resource(qURL);
        ClientResponse response = resource.accept(MediaType.APPLICATION_JSON)
                .type(MediaType.APPLICATION_JSON).entity(entity)
                .post(ClientResponse.class);
        String result = null;
        if (checkValidHttpResponse(response.getStatus())) result = response.getEntity(String.class);
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
    protected static String extractErrorData(String result) {
        ObjectMapper om = new ObjectMapper();
        try {
            JsonNode jn = om.readTree(result);
            JsonNode jnErr = jn.path("errors");
            Iterator<JsonNode> ite1 = jnErr.getElements();
            String err = "";
            while (ite1.hasNext()) {
                JsonNode jn1 = ite1.next();
                err += ", " + jn1.getTextValue();
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
     * @return the data list
     */
    protected static ArrayList<String> extractListData(String result) {
        ArrayList<String> al = new ArrayList<>();
        ObjectMapper om = new ObjectMapper();
        try {
            JsonNode jn = om.readTree(result);
            JsonNode jnRes = jn.path("results");
            Iterator<JsonNode> ite1 = jnRes.getElements();
            while (ite1.hasNext()) {
                JsonNode jn1 = ite1.next();
                int nbCol = jn1.path("columns").size();
                if (nbCol > 1) throw new IOException("To extract more than 1 column use an other method !");
                JsonNode jnDat = jn1.path("data");
                Iterator<JsonNode> ite2 = jnDat.getElements();
                while (ite2.hasNext()) {
                    JsonNode jn2 = ite2.next();
                    JsonNode jnRow = jn2.path("row");
                    Iterator<JsonNode> ite3 = jnRow.getElements();
                    while (ite3.hasNext()) {
                        JsonNode jn3 = ite3.next();
                        if (jn3.isLong()) al.add(Long.toString(jn3.getLongValue()));
                        else al.add(jn3.getTextValue());
                    }
                }
            }
        } catch (IOException ioe) {
            logger.debug("Error in extractListData: " + ioe.getMessage());
        }
        return al;
    }

    /**
     * Creates a JSON formatted string for the data to be sent to the REST
     * interface. This data will be used to create a new relationship between
     * two nodes.
     *
     * @param node    the end node URI for the relationship
     * @param type    the relation type
     * @param attribs the set of the attributes of the relationship
     * @return the formatted data string
     */
    private static String createJsonRelation(URI node, String type,
                                             String... attribs) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (JsonGenerator jg = (new JsonFactory()).createJsonGenerator(baos)) {
                jg.useDefaultPrettyPrinter();
                jg.writeStartObject();
                jg.writeStringField("to", node.toString());
                jg.writeStringField("type", type);
                if (attribs != null) {
                    int len = attribs.length;
                    if ((len > 0) && ((len & 1) == 0)) {
                        jg.writeObjectFieldStart("data");
                        for (int i1 = 0; i1 < len; i1 = i1 + 2) {
                            jg.writeStringField(attribs[i1], attribs[i1 + 1]);
                        }
                        jg.writeEndObject();
                    }
                }
                jg.writeEndObject();
                jg.flush();
            }
            return baos.toString("UTF-8");
        } catch (IOException ioe) {
            logger.debug("Error in createJsonRelation: " + ioe.getMessage());
        }
        return null;
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
