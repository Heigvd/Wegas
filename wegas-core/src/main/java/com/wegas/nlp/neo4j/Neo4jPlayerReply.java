/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.nlp.neo4j;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.Reply;
import org.apache.commons.lang3.StringEscapeUtils;

import javax.annotation.Resource;
import javax.ejb.*;
import javax.enterprise.event.Observes;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Date;

/**
 * This class contains all the methods used to add, modify or delete graphs
 * objects in the neo4j database.
 *
 * @author Gérald Eberle
 */
@ConcurrencyManagement(ConcurrencyManagementType.BEAN)
@Singleton
public class Neo4jPlayerReply {

    private static final ObjectMapper objectMapper;

    static {
        objectMapper = new ObjectMapper();
        objectMapper.configure(JsonGenerator.Feature.QUOTE_FIELD_NAMES, false);
        objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
    }

    private enum TYPE {
        QUESTION,
        NUMBER
    }

    @Resource
    private SessionContext sessionContext;

    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    public void onReplyValidate(@Observes QuestionDescriptorFacade.ReplyValidate event) {
        sessionContext.getBusinessObject(Neo4jPlayerReply.class).addPlayerReply(event.player, event.reply, (ChoiceDescriptor) event.choice.getDescriptor(), (QuestionDescriptor) event.question.getDescriptor());
    }

    public void onNumberUpdate(@Observes RequestManager.NumberUpdate update) throws NoPlayerException, JsonProcessingException {
        sessionContext.getBusinessObject(Neo4jPlayerReply.class).addNumberUpdate(update.player, update.number);
    }

    @Asynchronous
    public synchronized void addNumberUpdate(Player player, NumberInstance numberInstance) throws NoPlayerException, JsonProcessingException {
        if (player == null) {
            player = variableInstanceFacade.findAPlayer(numberInstance);
        }
        if (player.getGame() instanceof DebugGame || player.getTeam() instanceof DebugTeam ||
                !com.wegas.nlp.neo4j.Neo4jUtils.checkDataBaseIsRunning()) {
            return;
        }
        final String key = nodeKey(player, TYPE.NUMBER);
        String query = "Match (n " + key + ") WITH max(n.starttime) AS max MATCH (m" + key + ") WHERE m.starttime = max return id(m)";

//        String initVal = "MATCH (n {variable:\"" + numberInstance.getDescriptor().getName() + "\",";
//        if (numberInstance.getScope() instanceof TeamScope) {
//            initVal += "teamId:" + player.getTeamId();
//        } else if (numberInstance.getScope() instanceof PlayerScope) {
//            initVal += "playerId:" + player.getId();
//        } else if (numberInstance.getScope() instanceof GameScope) {
//            initVal += "gameId:" + player.getGameId();
//        }
//        initVal += "}) RETURN n";
//        String existence = extractSingleResult(Neo4jUtils.queryDBString(initVal));

        String result1 = Neo4jUtils.queryDBString(query);
        checkError(result1);
        URI from = extractNodeUri(result1);
        ObjectNode newNode = createJsonNode(player, numberInstance.getDescriptor().getName(), numberInstance.getValue());
        createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
//        if (from == null) {
//            createNode(player.getGameModel().getName(), newNode);
//        } else {
//            createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
//        }
//        URI to = createNode(player, player.getGameModel().getName(), numberInstance.getDescriptor().getName(), numberInstance.getValue());
//        if (from != null) {
//            Neo4jUtils.createRelation(from, to, "gamelink");
//        }
    }

    /**
     * Creates or adds a player and its answer data in the graph belonging to
     * a given game.
     *
     * @param player the player data
     * @param reply  the player's answer data
     */
    @Asynchronous
    public synchronized void addPlayerReply(Player player, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) {
        if (player.getGame() instanceof DebugGame || !com.wegas.nlp.neo4j.Neo4jUtils.checkDataBaseIsRunning()) {
            return;
        }
        String key = nodeKey(player, TYPE.QUESTION);
        String game = player.getGameModel().getName();
        String query = "MATCH (n " + key + ") RETURN max(n.starttime)";
        String result1 = Neo4jUtils.queryDBString(query);
        checkError(result1);
        String maxTime = extractSingleResult(result1);
        if (maxTime == null) {
            createNode(player, game, reply, choiceDescriptor, questionDescriptor);
        } else {
            query = "MATCH (n " + key + ") WHERE n.starttime = " +
                    maxTime + " RETURN id(n)";
            String result2 = Neo4jUtils.queryDBString(query);
            checkError(result2);
            URI from = extractNodeUri(result2);
            URI to = createNode(player, game, reply, choiceDescriptor, questionDescriptor);
            Neo4jUtils.createRelation(from, to, "gamelink");
        }
    }

    /**
     * Extracts the choices identifiers list for a given player. The choices are
     * given in the timely order they were recorded.
     *
     * @param player the player data
     * @return the found list of choices
     */
    public static ArrayList<String> extractChoiceList(Player player) {
        if (!Neo4jUtils.checkDataBaseIsRunning()) return null;
        String key = nodeKey(player, TYPE.QUESTION);
        String query = "match (n " + key + ") return n.choice";
        String result = Neo4jUtils.queryDBString(query);
        checkError(result);
        return Neo4jUtils.extractListData(result);
    }

    /**
     * Constructs a key from several fields of the player's object.
     *
     * @param player the player data
     * @return the formed key
     */
    private static String nodeKey(Player player, TYPE type) {
        return "{playerId:" + player.getId() + ", teamId:" + player.getTeamId() + ", gameId:" + player.getGameId() + ", type:\"" + type.toString() + "\"}";
    }

    /**
     * Calls the methods used to create a new node, its label and properties.
     *
     * @param key        the key property value
     * @param playerName the name property value
     * @param reply      the values for the reply properties
     * @return the URI of the newly created node
     */
    private static URI createNode(Player player, String gameModelName, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) {
        ObjectNode jsonObject = objectMapper.createObjectNode();

        jsonObject.put("playerId", player.getId());
        jsonObject.put("type", TYPE.QUESTION.toString());
        jsonObject.put("teamId", player.getTeamId());
        jsonObject.put("gameId", player.getGameId());
        jsonObject.put("name", player.getName());
        jsonObject.put("starttime", (new Date()).getTime());
        jsonObject.put("choice", choiceDescriptor.getName());
        jsonObject.put("question", questionDescriptor.getName());
        jsonObject.put("result", reply.getResult().getName());
        jsonObject.put("impact", StringEscapeUtils.escapeEcmaScript(reply.getResult().getImpact().getContent()));

        URI node = Neo4jUtils.createNode(jsonObject.toString());
        Neo4jUtils.addNodeLabel(node, gameModelName);
        return node;
    }

    private static URI createNode(String gameModelName, ObjectNode jsonObject) throws JsonProcessingException {
        URI node = Neo4jUtils.createNode(jsonObject.toString());
        Neo4jUtils.addNodeLabel(node, gameModelName);
        return node;
    }

    private static ObjectNode createJsonNode(Player player, String name, double value) throws JsonProcessingException {
        ObjectNode jsonObject = objectMapper.createObjectNode();

        jsonObject.put("type", TYPE.NUMBER.toString());
        jsonObject.put("playerId", player.getId());
        jsonObject.put("teamId", player.getTeamId());
        jsonObject.put("gameId", player.getGameId());
        jsonObject.put("name", player.getName());
        jsonObject.put("starttime", (new Date()).getTime());
        jsonObject.put("variable", name);
        jsonObject.put("number", value);
        return jsonObject;
    }

    /**
     * @param origin
     * @param relationLabel
     * @param target
     */
    private static void createLinkedToYoungest(String key, String relationLabel, ObjectNode target, String label) throws JsonProcessingException {
        String query = "CREATE (p:`" + label + "` " + objectMapper.writeValueAsString(target) + ") WITH p AS p Match (n " + key
                + ") WHERE n <> p WITH max(n.starttime) AS max, p AS p MATCH (n " +
                key + ") WHERE n.starttime = max AND n <> p WITH n AS n, p AS p CREATE (n)-[:`" +
                relationLabel + "`]->(p) return p";
        Neo4jUtils.queryDBString(query);
    }

    /**
     * Extracts from the query result the first returned value.
     * The query result has a JSON format.
     *
     * @param result the query result
     * @return the maximum timestamp as a string
     */
    private static String extractSingleResult(String result) {
        ArrayList<String> al = Neo4jUtils.extractListData(result);
        if (al.isEmpty()) {
            return null;
        }
        if ("null".equals(al.get(0))) {
            return null;
        }
        return al.get(0);
    }

    /**
     * Extracts from the query result the node URI corresponding to the
     * maximum timestamp of a nodes list. The query result has a JSON format.
     *
     * @param result the query result
     * @return the URI of the node with a maximun timestamp
     */
    private static URI extractNodeUri(String result) {
        try {
            ArrayList<String> al = Neo4jUtils.extractListData(result);
            if (al.isEmpty()) {
                return null;
            }
            String location = al.get(0);
            return new URI(Neo4jUtils.NEO4J_SERVER_URL + "node/" + location);
        } catch (URISyntaxException ex) {
            // Nothing to do here
        }
        return null;
    }

    /**
     * Checks if an error occured during the execution of a query. The potential
     * error message is recorded in the JSON result of the query. If an error
     * was found this method raises an exception.
     *
     * @param result the result of the query
     */
    private static void checkError(String result) {
        String err = Neo4jUtils.extractErrorData(result);
        if (err == null) return;
        throw new RuntimeException(err);
    }
}
