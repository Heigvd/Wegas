/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.log.neo4j;

import com.wegas.core.Helper;
import org.neo4j.driver.v1.*;
import org.neo4j.driver.v1.exceptions.ClientException;
import org.neo4j.driver.v1.exceptions.NoSuchRecordException;
import org.neo4j.driver.v1.summary.ResultSummary;
import org.neo4j.driver.v1.util.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

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

    private static final String NEO4J_BASIC_USER = Helper.getWegasProperty("neo4j.server.user", "");

    private static final String NEO4J_BASIC_PASSWORD = Helper.getWegasProperty("neo4j.server.password", "");

    private static final Logger logger = LoggerFactory.getLogger(Neo4jUtils.class);


    private static final Driver driver;

    static {
        Driver tmpDriver = null;
        if (!Helper.isNullOrEmpty(NEO4J_SERVER_URL)) {
            try {
                tmpDriver = GraphDatabase.driver(NEO4J_SERVER_URL, AuthTokens.basic(NEO4J_BASIC_USER, NEO4J_BASIC_PASSWORD));
            } catch (Exception ex) {
                logger.error("Check neo4j configuration", ex);
            }
        }
        driver = tmpDriver;
    }

    /**
     * Sends a given query to the neo4j database and gets a response.
     *
     * @param parametrizedQuery the query to be submitted
     * @param keysAndValues     varargs alternate keys and value parameters
     * @return result from the query or an Empty result in case an error occurred.
     * mostly due to connectivity issue or wrong query.
     */

    static StatementResult queryDBString(String parametrizedQuery, Object... keysAndValues) throws ClientException {
        if(driver == null){
            return new EmptyStatementResult();
        }
        try (Session session = driver.session()) {
            return session.run(parametrizedQuery, Values.parameters(keysAndValues));
        } catch (ClientException ex) {
            logger.warn(ex.getLocalizedMessage());
            return new EmptyStatementResult();
        }
    }


    private static class EmptyStatementResult implements StatementResult {

        @Override
        public List<String> keys() {
            return new ArrayList<>();
        }

        @Override
        public boolean hasNext() {
            return false;
        }

        @Override
        public Record next() {
            return null;
        }

        @Override
        public Record single() throws NoSuchRecordException {
            throw new NoSuchRecordException("There is exactly 0 record in this result");
        }

        @Override
        public Record peek() {
            return null;
        }

        @Override
        public List<Record> list() {
            return new ArrayList<>();
        }

        @Override
        public <T> List<T> list(Function<Record, T> mapFunction) {
            return new ArrayList<>();
        }

        @Override
        public ResultSummary consume() {
            return null;
        }
    }

    public static boolean checkDatabaseExists() {
        return driver != null;
    }
}
