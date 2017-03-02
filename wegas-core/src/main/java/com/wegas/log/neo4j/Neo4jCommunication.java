package com.wegas.log.neo4j;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;

import javax.ejb.Asynchronous;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import java.util.Map;

/**
 * Neo4j Singleton for communicating with db
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
//@Singleton
@Stateless
@LocalBean
public class Neo4jCommunication {

    @Inject
    private HazelcastInstance hzInstance;


    /**
     * Link a new node to an already existing newest filtered by key
     *
     * @param key           key to filter "youngest" nodes
     * @param relationLabel label to put onto the relation
     * @param target        new node to create
     * @param label         label to put onto the node
     */
    @Asynchronous
    public void createLinkedToYoungest(Map<String, Object> key, String relationLabel, Map<String, Object> target, String label) {
        ILock lock = hzInstance.getLock("Neo4J");
        lock.lock();
        try {
            String query = "CREATE (p:`" + label + "` {target}) WITH p " +
                    "SET p.starttime = timestamp() WITH p " +
                    "MATCH (n {playerId:{key}.playerId, teamId:{key}.teamId, gameId:{key}.gameId, type:{key}.type}) " +
                    "WHERE n <> p WITH n, p ORDER BY n.starttime DESC LIMIT 1 " +
                    "CREATE (n)-[:`" + relationLabel + "`]->(p)";
            Neo4jUtils.queryDBString(query, "target", target, "key", key);
        } finally {
            lock.unlock();
        }
    }
}
