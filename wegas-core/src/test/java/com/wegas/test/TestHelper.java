/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.test;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import jakarta.ejb.embeddable.EJBContainer;
import jakarta.naming.InitialContext;
import jakarta.naming.NamingException;
import jakarta.sql.DataSource;
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

    public static int getMissingIndexesCount(Statement statement) throws SQLException{
            String createExtension = "CREATE EXTENSION IF NOT EXISTS intarray;";
            statement.execute(createExtension);

            String query = ""
                    + "SELECT tablename, array_to_string(column_name_list, ',') AS fields, pg_index.indexrelid::regclass, 'CREATE INDEX index_' || relname || '_' ||\n"
                    + "         array_to_string(column_name_list, '_') || ' on ' || tablename ||\n"
                    + "         ' (' || array_to_string(column_name_list, ',') || ') ' AS create_query\n"
                    + "FROM (\n"
                    + "SELECT DISTINCT\n" // selection all attributes form constraints
                    + "       tablename,\n"
                    + "       array_agg(attname) AS column_name_list,\n"
                    + "       array_agg(attnum) AS column_list\n"
                    + "     FROM pg_attribute\n"
                    + "          JOIN (SELECT tablename,\n"
                    + "                 conname,\n"
                    + "                 unnest(conkey) AS column_index\n"
                    + "                FROM (\n"
                    + "                   SELECT DISTINCT\n" // select all contraints
                    + "                        conrelid::regclass as tablename,\n"
                    + "                        conname,\n"
                    + "                        conkey\n"
                    + "                      FROM pg_constraint\n"
                    + "                        JOIN pg_class ON pg_class.oid = conrelid\n"
                    + "                        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace\n"
                    + "                      WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'\n" // but internal ones
                    + "                      ) fkey\n"
                    + "               ) fkey\n"
                    + "               ON fkey.tablename = pg_attribute.attrelid\n"
                    + "                  AND fkey.column_index = pg_attribute.attnum\n"
                    + "     GROUP BY tablename, conname\n"
                    + "     ) AS candidate_index\n"
                    + "JOIN pg_class ON pg_class.oid = candidate_index.tablename\n"
                    + "LEFT JOIN pg_index ON pg_index.indrelid = tablename\n" // join indexes matching same attributes as the constraint
                    + "                      AND array_to_string(sort(indkey), ' ') = array_to_string(sort(column_list), ' ')\n"
                    + "WHERE indexrelid IS NULL;"; // finallay only keep contraints without indexes
            ResultSet resultSet = statement.executeQuery(query);
            int count = 0;

            StringBuilder msg = new StringBuilder("Missing index(es):");

            while (resultSet.next()) {
                msg.append(System.lineSeparator()).append("  - ");
                msg.append(resultSet.getString("tablename")).append(" / ").append(resultSet.getString("fields"));
                msg.append(": ").append(resultSet.getString("create_query"));
                count++;
            }
            if (count > 0) {
                logger.error(msg.toString());
            }
            return count;
    }

    public static int getMissingIndexesCount() {
        DataSource ds;
        try {
            ds = (DataSource) new InitialContext().lookup("java:global/WegasDS");
        } catch (NamingException ex) {
            throw WegasErrorMessage.error("No java:global/WegasDS datasource !!!");
        }

        try (Connection connection = ds.getConnection("user", "1234");
                Statement statement = connection.createStatement()) {
            return getMissingIndexesCount(statement);
        } catch (SQLException ex) {
            logger.error("SQL Exception: {}", ex);
            throw WegasErrorMessage.error("SQL Query error");
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
        return Arrays.asList(element);
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

    public static String readFile(String path) {
        byte[] buffer;
        try {
            buffer = Files.readAllBytes(Paths.get(path));
        } catch (IOException ex) {
            return null;
        }
        return Charset.defaultCharset().decode(ByteBuffer.wrap(buffer)).toString();
    }

    public static GameModel loadGameModelFromFile(String path) throws IOException {
        String pmg = TestHelper.readFile(path);
        return JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
    }
}
