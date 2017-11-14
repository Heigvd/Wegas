/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.ejb.embeddable.EJBContainer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class TestHelper {

    private final static Logger logger = LoggerFactory.getLogger(TestHelper.class);

    private static EJBContainer container = null;

    private static final String DB_CON = "jdbc:postgresql://localhost:5432/wegas_test";

    private static final String USER = "user";

    private static final String PASSWORD = "1234";

    public static void emptyDBTables() {
        String sql = "DO\n"
                + "$func$\n"
                + "BEGIN \n"
                + "   EXECUTE\n"
                + "  (SELECT 'TRUNCATE TABLE '\n"
                + "       || string_agg(quote_ident(schemaname) || '.' || quote_ident(tablename), ', ')\n"
                + "       || ' CASCADE'\n"
                + "   FROM   pg_tables\n"
                + "   WHERE  (schemaname = 'public'\n"
                + "       AND tablename <> 'sequence')\n"
                + "   );\n"
                + "END\n"
                + "$func$;";

        try (Connection connection = DriverManager.getConnection(DB_CON, USER, PASSWORD);
                Statement st = connection.createStatement()) {
            st.execute(sql);
        } catch (SQLException ex) {
            logger.error("Table reset (SQL: " + sql + ")", ex);
        }
    }

    /**
     * Start a thread from a runnable
     *
     * @param r Runnable to start
     *
     * @return the started thread
     */
    public static Thread start(Runnable r) {
        return TestHelper.start(r, null);
    }

    /**
     * Start a thread from a runnable
     *
     * @param r       Runnable to start
     * @param handler
     *
     * @return the started thread
     */
    public static Thread start(Runnable r, Thread.UncaughtExceptionHandler handler) {
        final Thread thread = new Thread(r);
        if (handler != null) {
            thread.setUncaughtExceptionHandler(handler);
        }
        thread.start();
        return thread;
    }

    /**
     * Shortcut: Transform varargs into a list
     *
     * @param element varargs elements to add to the list
     * @param <E>     element type
     *
     * @return list of given elements
     */
    @SafeVarargs
    public static <E> List<E> toList(E... element) {
        return Arrays.stream(element).collect(Collectors.toList());
    }

    /**
     * Shortcut: Transform 2 lists into a map !Both list must have same length!
     * to inline everything see: {@link #toList}
     *
     * @param keys   keys of the map
     * @param values values of the map
     * @param <K>    key type
     * @param <V>    value type
     *
     * @return a map constructed from both input list
     */
    public static <K, V> Map<K, V> toMap(List<K> keys, List<V> values) {
        assert keys.size() == values.size();
        return keys.stream().collect(Collectors.toMap(Function.identity(), k -> values.get(keys.indexOf(k))));
    }
}
