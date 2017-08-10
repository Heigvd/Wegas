/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.integration;

import com.wegas.core.Helper;
import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import org.apache.commons.io.FileUtils;
import org.glassfish.embeddable.BootstrapProperties;
import org.glassfish.embeddable.Deployer;
import org.glassfish.embeddable.GlassFish;
import org.glassfish.embeddable.GlassFishException;
import org.glassfish.embeddable.GlassFishProperties;
import org.glassfish.embeddable.GlassFishRuntime;

/**
 *
 * @author maxence
 */
public class Wegas {

    private static final String WEGAS_DB_NAME_KEY = "wegas.db.name";
    private static final String WEGAS_DB_NAME_DEFAULTVALUE = "wegas_dev";

    private static final String WEGAS_DB_HOST_KEY = "wegas.db.host";
    private static final String WEGAS_DB_HOST_DEFAULTVALUE = "localhost";

    private static final String WEGAS_HTTP_THREADS_KEY = "wegas.http.threads";
    private static final String WEGAS_HTTP_THREADS_DEFAULTVALUE = "5";

    //private static final Logger logger = LoggerFactory.getLogger(Wegas.class);
    private static void resetDB(String dbName) {
        final String DB_CON = "jdbc:postgresql://localhost:5432/" + dbName;
        final String USER = "user";
        final String PASSWORD = "1234";
        try (Connection connection = DriverManager.getConnection(DB_CON, USER, PASSWORD);
                Statement st = connection.createStatement()) {
            st.execute("DROP SCHEMA public CASCADE;");
            st.execute("CREATE SCHEMA public;");
        } catch (SQLException ex) {
        }
    }

    public static final class WegasRuntime {

        private GlassFish payara;
        private String appName;
        private String baseUrl;
        private File domainConfig;

        public WegasRuntime() {
        }

        public GlassFish getPayara() {
            return payara;
        }

        public void setPayara(GlassFish payara) {
            this.payara = payara;
        }

        public String getAppName() {
            return appName;
        }

        public void setAppName(String appName) {
            this.appName = appName;
        }

        public File getDomainConfig() {
            return domainConfig;
        }

        public void setDomainConfig(File domainConfig) {
            this.domainConfig = domainConfig;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String toString() {
            return "WegasRuntime UP: " + baseUrl;
        }

    }

    public static WegasRuntime boot(String dbName, String dbHost, Integer nbThreads, Boolean resetDB, int httpPort) throws IOException, GlassFishException {
        System.setProperty(WEGAS_DB_HOST_KEY, dbHost != null ? dbHost : WEGAS_DB_HOST_DEFAULTVALUE);
        System.setProperty(WEGAS_DB_NAME_KEY, dbName != null ? dbName : WEGAS_DB_NAME_DEFAULTVALUE);
        System.setProperty(WEGAS_HTTP_THREADS_KEY, nbThreads != null ? nbThreads.toString() : WEGAS_HTTP_THREADS_DEFAULTVALUE);

        if (resetDB != null && resetDB) {
            resetDB(dbName);
        }

        WegasRuntime env = new WegasRuntime();

        BootstrapProperties bootstrapProperties = new BootstrapProperties();

        GlassFishProperties glassfishProperties = new GlassFishProperties();
        glassfishProperties.setPort("http-listener-1", httpPort);
        // setHzClusterName("hz-WegasIntegrationTest");

        String root = ".";

        File domainConfig = new File(root + "/src/test/glassfish/domains/domain1/config/domain.xml");
        File tmpDomainConfig = File.createTempFile("domain", "xml");
        FileUtils.copyFile(domainConfig, tmpDomainConfig);

        glassfishProperties.setConfigFileURI(tmpDomainConfig.toURI().toString());
        //glassfishProperties.setConfigFileReadOnly(false);
        Wegas.resetDB(dbName);

        GlassFish glassfish = GlassFishRuntime.bootstrap(bootstrapProperties).newGlassFish(glassfishProperties);
        //Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        //Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);
        glassfish.start();

        File war = new File(root + "/target/Wegas.war");
        Deployer deployer = glassfish.getDeployer();
        String appName = deployer.deploy(war);

        File appDirectory = new File(root + "/target/Wegas/");
        Helper.setWegasRootDirectory(appDirectory.getAbsolutePath());

        env.setAppName(appName);
        env.setBaseUrl("http://localhost:" + httpPort + "/" + appName);
        env.setDomainConfig(tmpDomainConfig);
        env.setPayara(glassfish);

        System.out.println(env);

        return env;
    }

    public static void main(String... args) throws IOException, InterruptedException, GlassFishException {
        WegasRuntime boot = Wegas.boot("wegas_dev", "localhost", 5, false, 5454);

        Thread.currentThread().wait();

        Wegas.shutdown(boot);
    }

    public static void shutdown(WegasRuntime runtime) throws GlassFishException {
        GlassFish payara = runtime.getPayara();
        if (payara != null) {
            String appName = runtime.getAppName();
            payara.getDeployer().undeploy(appName);
            payara.stop();
        }
        runtime.getDomainConfig().delete();
    }

}
