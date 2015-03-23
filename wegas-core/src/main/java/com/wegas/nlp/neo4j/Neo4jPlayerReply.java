/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.nlp.neo4j;

import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Player;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.Reply;

import javax.annotation.Resource;
import javax.ejb.Asynchronous;
import javax.ejb.SessionContext;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.enterprise.event.TransactionPhase;
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

@Stateless
public class Neo4jPlayerReply {

    @Resource
    private SessionContext sessionContext;

    public void onReplyValidate(@Observes(during = TransactionPhase.AFTER_COMPLETION) QuestionDescriptorFacade.ReplyValidate event) {
        sessionContext.getBusinessObject(Neo4jPlayerReply.class).addPlayerReply(event.player, event.reply);
    }

    /**
     * Creates or adds a player and its answer data in the graph belonging to
     * a given game.
     *
     * @param player the player data
     * @param reply  the player's answer data
     */
    @Asynchronous
    public void addPlayerReply(Player player, Reply reply) {
        if (player.getGame() instanceof DebugGame || !com.wegas.nlp.neo4j.Neo4jUtils.checkDataBaseIsRunning()) {
            return;
        }
        String key = generateKey(player);
        String game = player.getGameModel().getName();
        String query = "MATCH (n {key : '" + key + "'}) RETURN max(toint(n.starttime))";
        String result1 = Neo4jUtils.queryDBString(query);
        checkError(result1);
        String maxTime = extractTimeData(result1);
        if (maxTime == null) {
            createNode(key, game, player.getName(), reply);
        } else {
            query = "MATCH (n) WHERE n.key = '" + key + "' AND n.starttime = '" +
                    maxTime + "' RETURN n.location";
            String result2 = Neo4jUtils.queryDBString(query);
            checkError(result2);
            URI from = extractNodeUri(result2);
            URI to = createNode(key, game, player.getName(), reply);
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
        String key = generateKey(player);
        String query = "match (n {key : '" + key + "'}) return n.choice";
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
    private static String generateKey(Player player) {
        return Long.toString(player.getId()) + "&" +
                Long.toString(player.getTeam().getId()) + "&" +
                Integer.toString(player.getGameId());
    }

    /**
     * Calls the methods used to create a new node, its label and properties.
     *
     * @param key   the key property value
     * @param name  the name property value
     * @param reply the values for the reply properties
     * @return the URI of the newly created node
     */
    private static URI createNode(String key, String game, String name, Reply reply) {
        URI node = Neo4jUtils.createNode();
        Neo4jUtils.addNodeLabel(node, game);
        Neo4jUtils.addNodeProperty(node, "key", key);
        Neo4jUtils.addNodeProperty(node, "location", node.toString());
        Neo4jUtils.addNodeProperty(node, "name", name);
        Neo4jUtils.addNodeProperty(node, "starttime", Long.toString((new Date().getTime())));
        Neo4jUtils.addNodeProperty(node, "choice", Long.toString(reply.getResult().getId()));
        return node;
    }

    /**
     * Extracts from the query result the timestamp corresponding to the
     * maximum timestamp of a nodes list. The query result has a JSON format.
     *
     * @param result the query result
     * @return the maximum timestamp as a string
     */
    private static String extractTimeData(String result) {
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
            return new URI(location);
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
