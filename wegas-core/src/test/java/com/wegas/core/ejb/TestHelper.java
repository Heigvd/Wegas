/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
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
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;

import static java.util.logging.Logger.getLogger;

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

        }
        emptyDBTables();
        return container;
    }

    private static void emptyDBTables() {

        try (Connection connection = DriverManager.getConnection(DB_CON, USER, PASSWORD);
             Statement st = connection.createStatement()) {
            st.execute("DO\n" +
                    "$func$\n" +
                    "BEGIN \n" +
                    "   EXECUTE\n" +
                    "  (SELECT 'TRUNCATE TABLE '\n" +
                    "       || string_agg(quote_ident(schemaname) || '.' || quote_ident(tablename), ', ')\n" +
                    "       || ' CASCADE'\n" +
                    "   FROM   pg_tables\n" +
                    "   WHERE  (schemaname = 'public'\n" +
                    "       AND tablename <> 'sequence')\n" +
                    "   );\n" +
                    "END\n" +
                    "$func$;");

        } catch (SQLException ex) {
            logger.error("Table reset", ex);
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

    public static synchronized void closeContainer() {
        //it closes itself on vm shutdown
//        if (container != null) {
//            container.close();
//            container = null;
//        }
    }
}
