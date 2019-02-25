/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.neo4j;

import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.NumberListener;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.Reply;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import org.apache.commons.text.StringEscapeUtils;

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
        WH_QUESTION,
        TEXT,
        STRING,
        NUMBER
    }

    @Inject
    private Neo4jCommunication neo4jCommunication;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    public void onReplyValidate(@Observes QuestionDescriptorFacade.ReplyValidate event) {
        this.addPlayerReply(event.player, event.reply, (ChoiceDescriptor) event.choice.getDescriptor(), (QuestionDescriptor) event.question.getDescriptor());
    }

    public void onReplyValidate(@Observes QuestionDescriptorFacade.WhValidate event) {
        this.addWhPlayerReply(event.player, event.whDescriptor);
    }

    public void onNumberUpdate(@Observes NumberListener.NumberUpdate update) {
        this.addNumberUpdate(update.player, update.number);
    }

    private void addNumberUpdate(final Player player, final NumberInstance numberInstance) {
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
     * @param player the player data
     * @param whDesc the validated WhQuestionDescription
     */
    private void addWhPlayerReply(final Player player, WhQuestionDescriptor whDesc) {
        if (player.getTeam() instanceof DebugTeam
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || !Neo4jUtils.checkDatabaseExists()) {
            return;
        }

        for (VariableDescriptor item : whDesc.getItems()) {
            Map<String, Object> newNode = null;
            Map<String, Object> key = null;
            if (item instanceof NumberDescriptor) {
                // skip numbers
            } else if (item instanceof StringDescriptor) {
                newNode = this.createJsonNode(player, (StringDescriptor) item);
                key = Neo4jPlayerReply.nodeKey(player, TYPE.STRING);
            } else if (item instanceof TextDescriptor) {
                newNode = this.createJsonNode(player, (TextDescriptor) item);
                key = Neo4jPlayerReply.nodeKey(player, TYPE.TEXT);
            }

            if (newNode != null) {
                neo4jCommunication.createLinkedToYoungest(key, "gamelink", newNode, player.getGameModel().getName());
            }
        }

        Map<String, Object> key = Neo4jPlayerReply.nodeKey(player, TYPE.WH_QUESTION);
        Map<String, Object> newNode = Neo4jPlayerReply.createJsonNode(player, whDesc);
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
     *
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
     * Creates a new WhQuestion node, with all the necessary properties.
     *
     * @param player             the player data
     * @param reply              the player's answer data
     * @param choiceDescriptor   the selected choice description
     * @param questionDescriptor the selected question description
     *
     * @return a node object
     */
    private static Map<String, Object> createJsonNode(Player player, WhQuestionDescriptor whQuestionDescriptor) {
        Map<String, Object> object = nodeKey(player, TYPE.WH_QUESTION);
        object.put("whquestion", whQuestionDescriptor.getName());
        object.put("logID", player.getGameModel().getProperties().getLogID());
        return object;
    }

    /**
     * Creates a new Question node, with all the necessary properties.
     *
     * @param player             the player data
     * @param reply              the player's answer data
     * @param choiceDescriptor   the selected choice description
     * @param questionDescriptor the selected question description
     *
     * @return a node object
     */
    private static Map<String, Object> createJsonNode(Player player, Reply reply, ChoiceDescriptor choiceDescriptor, QuestionDescriptor questionDescriptor) {
        Map<String, Object> object = nodeKey(player, TYPE.QUESTION);

        object.put("choice", choiceDescriptor.getName());
        object.put("question", questionDescriptor.getName());
        object.put("result", reply.getResult().getName());
        object.put("times", questionDescriptor.getInstance(player).getReplies(player, true).size());
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
     *
     * @return a node object
     */
    private static Map<String, Object> createJsonNode(Player player, String name, double value) {
        Map<String, Object> object = nodeKey(player, TYPE.NUMBER);
        object.put("variable", name);
        object.put("number", value);
        object.put("logID", player.getGameModel().getProperties().getLogID());
        return object;
    }

    /**
     * Creates a new Text node, with all the necessary properties.
     *
     * @param player the player data
     * @param name   the variable name
     * @param value  the actual variable value
     *
     * @return a node object
     */
    private Map<String, Object> createJsonNode(Player player, TextDescriptor descriptor) {
        Map<String, Object> object = nodeKey(player, TYPE.TEXT);
        object.put("variable", descriptor.getName());
        object.put("value", ((TextInstance) variableDescriptorFacade.getInstance(descriptor, player)).getTrValue().translateOrEmpty(player));
        object.put("logID", player.getGameModel().getProperties().getLogID());
        return object;
    }

    /**
     * Creates a new Text node, with all the necessary properties.
     *
     * @param player the player data
     * @param name   the variable name
     * @param value  the actual variable value
     *
     * @return a node object
     */
    private Map<String, Object> createJsonNode(Player player, StringDescriptor descriptor) {
        Map<String, Object> object = nodeKey(player, TYPE.STRING);
        object.put("variable", descriptor.getName());
        object.put("value", ((StringInstance) variableDescriptorFacade.getInstance(descriptor, player)).getTrValue().translateOrEmpty(player));
        object.put("logID", player.getGameModel().getProperties().getLogID());
        return object;
    }
}
