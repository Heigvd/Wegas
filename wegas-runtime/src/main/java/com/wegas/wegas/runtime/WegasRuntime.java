/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.wegas.runtime;

import fish.payara.micro.BootstrapException;
import fish.payara.micro.PayaraMicro;
import fish.payara.micro.PayaraMicroRuntime;
import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import org.apache.commons.io.FileUtils;
//import org.apache.commons.io.FileUtils;

/**
 * Main class to run Wegas
 *
 * @author maxence
 */
public class WegasRuntime {

    private static final String WEGAS_DB_NAME_KEY = "wegas.db.name";
    private static final String WEGAS_DB_NAME_DEFAULTVALUE = "wegas_dev";

    private static final String WEGAS_DB_HOST_KEY = "wegas.db.host";
    private static final String WEGAS_DB_HOST_DEFAULTVALUE = "localhost";

    private static final String WEGAS_HTTP_THREADS_KEY = "wegas.http.threads";
    private static final String WEGAS_HTTP_THREADS_DEFAULTVALUE = "5";

    private static final String WEGAS_HTTP_POPULATORS_KEY = "wegas.nb_populators";
    private static final String WEGAS_HTTP_POPULATORS_DEFAULTVALUE = "3";

    private PayaraMicroRuntime payara;
    private String appName;
    private String baseUrl;
    private File domainConfig;

    public WegasRuntime() {
    }

    public PayaraMicroRuntime getPayara() {
        return payara;
    }

    public void setPayara(PayaraMicroRuntime payara) {
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

    public static final WegasRuntime boot(
            String dbName,
            String dbHost,
            Integer nbThreads,
            Integer nbPopulators,
            Boolean resetDb
    ) throws BootstrapException, IOException {
        System.setProperty(WEGAS_DB_HOST_KEY, dbHost != null ? dbHost : WEGAS_DB_HOST_DEFAULTVALUE);
        System.setProperty(WEGAS_DB_NAME_KEY, dbName != null ? dbName : WEGAS_DB_NAME_DEFAULTVALUE);
        System.setProperty(WEGAS_HTTP_THREADS_KEY, nbThreads != null
                ? nbThreads.toString() : WEGAS_HTTP_THREADS_DEFAULTVALUE);
        System.setProperty(WEGAS_HTTP_POPULATORS_KEY, nbPopulators != null
                ? nbPopulators.toString() : WEGAS_HTTP_POPULATORS_DEFAULTVALUE);

        if (resetDb) {
            resetDB(dbName);
        }

        WegasRuntime wr = new WegasRuntime();

        String root = "../wegas-app/";

        File domainConfig = new File("./src/main/resources/domain.xml");
        File tmpDomainConfig = File.createTempFile("domain", ".xml");

        FileUtils.copyFile(domainConfig, tmpDomainConfig);

        String warPath = root + "target/Wegas";

        File theWar = new File(warPath);

        PayaraMicroRuntime bootstrap = PayaraMicro.getInstance()
                .setAlternateDomainXML(tmpDomainConfig)
                .addDeploymentFile(theWar)
                .setHttpAutoBind(true)
                .setSslAutoBind(true)
                .bootStrap();

        String appName = bootstrap.getDeployedApplicationNames().iterator().next();
        Integer httpPort = bootstrap.getLocalDescriptor().getHttpPorts().get(0);
        String appUrl = bootstrap.getLocalDescriptor().getApplicationURLS().get(0).toString();

        System.out.println("AppName: " + appName);
        System.out.println("Port: " + httpPort);
        System.out.println("URL: " + appUrl);

        wr.setAppName(appName);
        wr.setBaseUrl("http://localhost:" + httpPort + "/" + appName);
        wr.setDomainConfig(tmpDomainConfig);
        wr.setPayara(bootstrap);
        return wr;
    }

    public static void main(String... args) throws BootstrapException, IOException {

        WegasRuntime boot = WegasRuntime.boot("wegas_dev", "localhost", null, null, false);

        Runtime.getRuntime().addShutdownHook(new Thread() {
            @Override
            public void run() {
                try {
                    System.out.println("Shutdown Hook");
                    boot.getPayara().shutdown();
                } catch (BootstrapException ex) {
                    System.out.println("Perdu");
                }
            }
        });

        System.out.println("Running");
    }
}
