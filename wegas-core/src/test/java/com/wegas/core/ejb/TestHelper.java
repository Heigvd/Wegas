/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.stream.Collectors;

import static java.util.logging.Logger.getLogger;
import javax.ejb.EJBException;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class TestHelper {

    private final static Logger logger = LoggerFactory.getLogger(TestHelper.class);

    private static EJBContainer container = null;

    private static final String DB_CON = "jdbc:postgresql://localhost:5432/wegas_test";

    private static final String USER = "user";

    private static final String PASSWORD = "1234";

    public static synchronized EJBContainer getEJBContainer() throws NamingException {
        if (container == null) {
            try {
                String clusterNameKey = "wegas.hazelcast.clustername";
                String clusterName = "hz_wegas_test_cluster_" + Helper.genToken(5);
                System.setProperty(clusterNameKey, clusterName);

                Map<String, Object> properties = new HashMap<>();                       // Init Ejb container
                properties.put(EJBContainer.MODULES, new File[]{new File("target/embed-classes")});
                properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");
                //properties.put(EJBContainer.APP_NAME,"class");
                //ejbContainer.getContext().rebind("inject", this);

                // Init shiro
                SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
                getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.SEVERE);
                getLogger("javax.enterprise.system").setLevel(Level.SEVERE);
                org.glassfish.ejb.LogFacade.getLogger().setLevel(Level.SEVERE);
                container = EJBContainer.createEJBContainer(properties);
                if (container == null) {
                    throw WegasErrorMessage.error("FATAL ERROR WHILE SETTING EJB_CONTAINER UP");
                }
            } catch (EJBException ex) {
                logger.error("Fatal EjbException : " + ex);
                throw ex;
            }
        }
        return container;
    }

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
        wipeEmCache();
    }

    public static void wipeEmCache() {
        try {
            final HelperBean helperBean = Helper.lookupBy(container.getContext(), HelperBean.class, HelperBean.class);
            helperBean.wipeCache();
        } catch (NamingException e) {
            e.printStackTrace();
        }
    }

    /**
     * Start a thread from a runnable
     *
     * @param r Runnable to start
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
     * @return a map constructed from both input list
     */
    public static <K, V> Map<K, V> toMap(List<K> keys, List<V> values) {
        assert keys.size() == values.size();
        return keys.stream().collect(Collectors.toMap(Function.identity(), k -> values.get(keys.indexOf(k))));
    }

    public static synchronized void closeContainer() {
        //it closes itself on vm shutdown
//        if (container != null) {
//            container.close();
//            container = null;
//        }
    }
}
