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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestManager;
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
import java.util.Date;

/**
 * This class contains all the methods used to add, modify or delete graphs
 * objects in the neo4j database.
 *
 * @author Gérald Eberle
 * @author Cyril Junod <cyril.junod at gmail.com>
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

    public void onReplyValidate(@Observes QuestionDescriptorFacade.ReplyValidate event) throws JsonProcessingException {
        sessionContext.getBusinessObject(Neo4jPlayerReply.class).addPlayerReply(event.player, event.reply, (ChoiceDescriptor) event.choice.getDescriptor(), (QuestionDescriptor) event.question.getDescriptor());
    }

    public void onNumberUpdate(@Observes RequestManager.NumberUpdate update) throws NoPlayerException, JsonProcessingException {
        sessionContext.getBusinessObject(Neo4jPlayerReply.class).addNumberUpdate(update.player, update.number);
    }

    @Asynchronous
    private void addNumberUpdate(Player player, NumberInstance numberInstance) throws NoPlayerException, JsonProcessingException {
        if (player == null || player.getGame() instanceof DebugGame || player.getTeam() instanceof DebugTeam
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jUtils.checkDataBaseIsRunning()) {
            return;
        }
        final String key = nodeKey(player, TYPE.NUMBER);
        synchronized (player) {
            ObjectNode newNode = createJsonNode(player, numberInstance.getDescriptor().getName(), numberInstance.getValue());
            createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
        }
    }

    /**
     * Creates or adds a player and its answer data in the graph belonging to a
     * given game.
     *
     * @param player the player data
     * @param reply the player's answer data
     * @param choiceDescriptor the selected choice description
     * @param questionDescriptor the selected question description
     * @throws JsonProcessingException
     */
    @Asynchronous
    private synchronized void addPlayerReply(Player player, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) throws JsonProcessingException {
        if (player.getGame() instanceof DebugGame
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jUtils.checkDataBaseIsRunning()) {
            return;
        }
        String key = nodeKey(player, TYPE.QUESTION);
        synchronized (player) {
            ObjectNode newNode = createJsonNode(player, reply, choiceDescriptor, questionDescriptor);
            createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
        }
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
     * Creates a new Question node, with all the necessary properties.
     *
     * @param player the player data
     * @param reply the player's answer data
     * @param choiceDescriptor the selected choice description
     * @param questionDescriptor the selected question description
     * @return a node object
     */
    private static ObjectNode createJsonNode(Player player, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) {
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
        jsonObject.put("logID", player.getGameModel().getProperties().getLogID());
        return jsonObject;
    }

    /**
     * Creates a new Number node, with all the necessary properties.
     *
     * @param player the player data
     * @param name the variable name
     * @param value the actual variable value
     * @return a node object
     * @throws JsonProcessingException
     */
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
        jsonObject.put("logID", player.getGameModel().getProperties().getLogID());
        return jsonObject;
    }

    /**
     * Link a new node to an already existing newest filtered by key
     *
     * @param key key to filter "youngest" nodes
     * @param relationLabel label to put onto the relation
     * @param target new node to create
     * @param label label to put onto the node
     * @throws JsonProcessingException
     */
    private static void createLinkedToYoungest(String key, String relationLabel, ObjectNode target, String label) throws JsonProcessingException {
        String query = "CREATE (p:`" + label + "` " + objectMapper.writeValueAsString(target) + ") WITH p AS p Match (n " + key
                + ") WHERE n <> p WITH max(n.starttime) AS max, p AS p MATCH (n "
                + key + ") WHERE n.starttime = max AND n <> p WITH n AS n, p AS p CREATE (n)-[:`"
                + relationLabel + "`]->(p) return p";
        String result = Neo4jUtils.queryDBString(query);
        checkError(result);
    }

    /**
     * Checks if an error occurred during the execution of a query. The
     * potential error message is recorded in the JSON result of the query. If
     * an error was found this method raises an exception.
     *
     * @param result the result of the query
     */
    private static void checkError(String result) {
        String err = Neo4jUtils.extractErrorData(result);
        if (err == null) {
            return;
        }
        throw new RuntimeException(err);
    }
}
