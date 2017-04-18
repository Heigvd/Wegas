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
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.Reply;
import org.apache.commons.lang3.StringEscapeUtils;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import java.util.HashMap;
import java.util.Map;

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

    public void onReplyValidate(@Observes QuestionDescriptorFacade.ReplyValidate event) {
        this.addPlayerReply(event.player, event.reply, (ChoiceDescriptor) event.choice.getDescriptor(), (QuestionDescriptor) event.question.getDescriptor());
    }

    public void onNumberUpdate(@Observes NumberListener.NumberUpdate update) throws NoPlayerException {
        this.addNumberUpdate(update.player, update.number);
    }

    private void addNumberUpdate(final Player player, final NumberInstance numberInstance) throws NoPlayerException {
        if (player == null || player.getTeam() instanceof DebugTeam || player.getTeam() instanceof DebugTeam
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jUtils.checkDatabaseExists()) {
            return;
        }
        final Map<String, Object> key = Neo4jPlayerReply.nodeKey(player, TYPE.NUMBER);
        Map<String, Object> newNode = Neo4jPlayerReply.createJsonNode(player, numberInstance.getDescriptor().getName(), numberInstance.getValue());
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
     */
    private void addPlayerReply(final Player player, Reply reply, final ChoiceDescriptor choiceDescriptor, final QuestionDescriptor questionDescriptor) {
        if (player.getTeam() instanceof DebugTeam
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jUtils.checkDatabaseExists()) {
            return;
        }
        Map<String, Object> key = Neo4jPlayerReply.nodeKey(player, TYPE.QUESTION);
        Map<String, Object> newNode = Neo4jPlayerReply.createJsonNode(player, reply, choiceDescriptor, questionDescriptor);
        neo4jCommunication.createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
    }

    /**
     * Constructs a key from several fields of the player's object.
     *
     * @param player the player data
     * @return the formed key
     */
    private static Map<String, Object> nodeKey(Player player, TYPE type) {
        Map<String, Object> key = new HashMap<>();
        key.put("playerId", player.getId());
        key.put("teamId", player.getTeamId());
        key.put("gameId", player.getGameId());
        key.put("type", type.toString());
        return key;
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
    private static Map<String, Object> createJsonNode(Player player, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) {
        Map<String, Object> object = new HashMap<>();

        object.put("playerId", player.getId());
        object.put("type", TYPE.QUESTION.toString());
        object.put("teamId", player.getTeamId());
        object.put("gameId", player.getGameId());
        object.put("name", player.getName());
        object.put("choice", choiceDescriptor.getName());
        object.put("question", questionDescriptor.getName());
        object.put("result", reply.getResult().getName());
        object.put("times", reply.getQuestionInstance().getReplies().size());
        if (reply.getResult().getImpact() != null) {
            object.put("impact", StringEscapeUtils.escapeEcmaScript(reply.getResult().getImpact().getContent()));
        } else {
            object.put("impact", "");
        }
        object.put("logID", player.getGameModel().getProperties().getLogID());
        return object;
    }

    /**
     * Creates a new Number node, with all the necessary properties.
     *
     * @param player the player data
     * @param name   the variable name
     * @param value  the actual variable value
     * @return a node object
     */
    private static Map<String, Object> createJsonNode(Player player, String name, double value) {
        Map<String, Object> object = new HashMap<>();
        object.put("type", TYPE.NUMBER.toString());
        object.put("playerId", player.getId());
        object.put("teamId", player.getTeamId());
        object.put("gameId", player.getGameId());
        object.put("name", player.getName());
        object.put("variable", name);
        object.put("number", value);
        object.put("logID", player.getGameModel().getProperties().getLogID());
        return object;
    }
}
