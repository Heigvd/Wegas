/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.log.neo4j;

import com.wegas.core.Helper;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.NumberListener;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.Reply;
import org.apache.commons.lang3.StringEscapeUtils;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.codehaus.jettison.json.JSONString;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;

/**
 * This class contains all the methods used to add, modify or delete graphs
 * objects in the neo4j database.
 *
 * @author Gérald Eberle
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class Neo4jPlayerReply {

    enum TYPE {

        QUESTION,
        NUMBER
    }

    @EJB
    private Neo4jCommunication neo4jCommunication;

    public void onReplyValidate(@Observes QuestionDescriptorFacade.ReplyValidate event) throws JSONException {
        this.addPlayerReply(event.player, event.reply, (ChoiceDescriptor) event.choice.getDescriptor(), (QuestionDescriptor) event.question.getDescriptor());
    }

    public void onNumberUpdate(@Observes NumberListener.NumberUpdate update) throws NoPlayerException, JSONException {
        this.addNumberUpdate(update.player, update.number);
    }

    private void addNumberUpdate(final Player player, final NumberInstance numberInstance) throws NoPlayerException, JSONException {
        if (player == null || player.getGame() instanceof DebugGame || player.getTeam() instanceof DebugTeam
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jCommunication.isDBUp()) {
            return;
        }
        final String key = Neo4jPlayerReply.nodeKey(player, Neo4jPlayerReply.TYPE.NUMBER);
        JSONObject newNode = Neo4jPlayerReply.createJsonNode(player, numberInstance.getDescriptor().getName(), numberInstance.getValue());
        neo4jCommunication.createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
    }

    /**
     * Creates or adds a player and its answer data in the graph belonging to a
     * given game.
     *
     * @param player             the player data
     * @param reply              the player's answer data
     * @param choiceDescriptor   the selected choice description
     * @param questionDescriptor the selected question description
     * @throws JSONException
     */
    private void addPlayerReply(final Player player, Reply reply, final ChoiceDescriptor choiceDescriptor, final QuestionDescriptor questionDescriptor) throws JSONException {
        if (player.getGame() instanceof DebugGame
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jCommunication.isDBUp()) {
            return;
        }
        String key = Neo4jPlayerReply.nodeKey(player, Neo4jPlayerReply.TYPE.QUESTION);
        JSONObject newNode = Neo4jPlayerReply.createJsonNode(player, reply, choiceDescriptor, questionDescriptor);
        neo4jCommunication.createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
    }

    /**
     * Constructs a key from several fields of the player's object.
     *
     * @param player the player data
     * @return the formed key
     */
    static String nodeKey(Player player, TYPE type) {
        return "{playerId:" + player.getId() + ", teamId:" + player.getTeamId() + ", gameId:" + player.getGameId() + ", type:\"" + type.toString() + "\"}";
    }

    /**
     * Creates a new Question node, with all the necessary properties.
     *
     * @param player             the player data
     * @param reply              the player's answer data
     * @param choiceDescriptor   the selected choice description
     * @param questionDescriptor the selected question description
     * @return a node object
     */
    static JSONObject createJsonNode(Player player, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) throws JSONException {
        JSONObject jsonObject = new JSONObject();

        jsonObject.put("playerId", player.getId());
        jsonObject.put("type", TYPE.QUESTION.toString());
        jsonObject.put("teamId", player.getTeamId());
        jsonObject.put("gameId", player.getGameId());
        jsonObject.put("name", player.getName());
        jsonObject.put("starttime", new JSONFunction("timestamp()"));
        jsonObject.put("choice", choiceDescriptor.getName());
        jsonObject.put("question", questionDescriptor.getName());
        jsonObject.put("result", reply.getResult().getName());
        jsonObject.put("times", reply.getQuestionInstance().getReplies().size());
        if (reply.getResult().getImpact() != null) {
            jsonObject.put("impact", StringEscapeUtils.escapeEcmaScript(reply.getResult().getImpact().getContent()));
        } else {
            jsonObject.put("impact", "");
        }
        jsonObject.put("logID", player.getGameModel().getProperties().getLogID());
        return jsonObject;
    }

    /**
     * Creates a new Number node, with all the necessary properties.
     *
     * @param player the player data
     * @param name   the variable name
     * @param value  the actual variable value
     * @return a node object
     * @throws JSONException
     */
    static JSONObject createJsonNode(Player player, String name, double value) throws JSONException {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("type", TYPE.NUMBER.toString());
        jsonObject.put("playerId", player.getId());
        jsonObject.put("teamId", player.getTeamId());
        jsonObject.put("gameId", player.getGameId());
        jsonObject.put("name", player.getName());
        jsonObject.put("starttime", new JSONFunction("timestamp()"));
        jsonObject.put("variable", name);
        jsonObject.put("number", value);
        jsonObject.put("logID", player.getGameModel().getProperties().getLogID());
        return jsonObject;
    }

    private static class JSONFunction implements JSONString {

        private String string;

        public JSONFunction(String string) {
            this.string = string;
        }

        @Override
        public String toJSONString() {
            return string;
        }
    }
}
