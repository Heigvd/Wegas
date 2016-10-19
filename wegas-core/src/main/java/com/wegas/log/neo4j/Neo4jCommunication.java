package com.wegas.log.neo4j;

import org.codehaus.jettison.json.JSONObject;

import javax.ejb.Asynchronous;
import javax.ejb.LocalBean;
import javax.ejb.Schedule;
import javax.ejb.Singleton;

/**
 * Neo4j Singleton for communicating with db
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Singleton
@LocalBean
public class Neo4jCommunication {

    private static boolean dbUp = Neo4jUtils.checkDataBaseIsRunning();

    /**
     * Link a new node to an already existing newest filtered by key
     *
     * @param key           key to filter "youngest" nodes
     * @param relationLabel label to put onto the relation
     * @param target        new node to create
     * @param label         label to put onto the node
     */
    @Asynchronous
    public void createLinkedToYoungest(String key, String relationLabel, JSONObject target, String label) {
        String query = "CREATE (p:`" + label + "` " + target.toString().replaceAll("\"([^\"]+)\"\\s*:", "$1:") + ") WITH p AS p Match (n " + key
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

    public static boolean isDBUp() {
        return dbUp;
    }

    @Schedule(hour = "*", minute = "*/15")
    private void checkDB() {
        dbUp = Neo4jUtils.checkDataBaseIsRunning();
    }
}
