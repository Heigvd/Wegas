/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.runtime;

import com.github.difflib.DiffUtils;
import com.github.difflib.algorithm.DiffException;
import com.github.difflib.patch.Patch;
import com.github.difflib.patch.PatchFailedException;
import fish.payara.micro.BootstrapException;
import fish.payara.micro.PayaraMicro;
import fish.payara.micro.PayaraMicroRuntime;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PropertyResourceBundle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main class to run Wegas
 *
 * @author maxence
 */
public class WegasRuntime {

    private static final Logger logger = LoggerFactory.getLogger(WegasRuntime.class);

    private static final Map<String, String> env;

    public static final String WEGAS_DB_HOST_KEY = "wegas.db.host";
    public static final String WEGAS_DB_PORT_KEY = "wegas.db.port";
    public static final String WEGAS_DB_NAME_KEY = "wegas.db.name";
    public static final String WEGAS_DB_USER_KEY = "wegas.db.user";
    public static final String WEGAS_DB_PASSWORD_KEY = "wegas.db.password";

    public static final String WEGAS_HTTP_THREADS_KEY = "wegas.http.threads";
    public static final String WEGAS_HTTP_POPULATORS_KEY = "wegas.nb_populators";
    public static final String CACHE_COORDINATION_PROTOCOL = "eclipselink.cache.coordination.protocol";
    public static final String CACHE_COORDINATION_CHANNEL = "eclipselink.cache.coordination.channel";

    public static final String PROPERTIES_PATH = "./src/main/resources/wegas-override.properties";

    private PayaraMicroRuntime payara;
    private String appName;
    private String baseUrl;

    private static boolean init = false;

    static {
        env = new HashMap<>();

        env.put(WEGAS_DB_HOST_KEY, "localhost");
        env.put(WEGAS_DB_PORT_KEY, "5432");
        env.put(WEGAS_DB_NAME_KEY, "wegas_dev");
        env.put(WEGAS_DB_USER_KEY, "user");
        env.put(WEGAS_DB_PASSWORD_KEY, "1234");
        env.put(WEGAS_HTTP_THREADS_KEY, "5");
        env.put(WEGAS_HTTP_POPULATORS_KEY, "3");
        env.put(CACHE_COORDINATION_PROTOCOL, "fish.payara.persistence.eclipselink.cache.coordination.HazelcastPublishingTransportManager");

        String clusterName;
        try {
            InetAddress localHost = InetAddress.getLocalHost();
            clusterName = "Hz" + localHost.getHostName() + "Cluster";
        } catch (UnknownHostException ex) {
            clusterName = "HzLocalCluster";
        }

        env.put(CACHE_COORDINATION_CHANNEL, clusterName);
    }

    public WegasRuntime() {
        // ensure a default constructor exists
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

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    @Override
    public String toString() {
        return "WegasRuntime UP: " + baseUrl;
    }

    public static void resetDB(String dbName) {
        final String host = System.getProperty(WEGAS_DB_HOST_KEY);
        final String port = System.getProperty(WEGAS_DB_PORT_KEY);

        final String user = System.getProperty(WEGAS_DB_USER_KEY);
        final String password = System.getProperty(WEGAS_DB_PASSWORD_KEY);

        final String dbConn = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
        try (Connection connection = DriverManager.getConnection(dbConn, user, password);
            Statement st = connection.createStatement()) {
            st.execute("DROP SCHEMA public CASCADE;");
            st.execute("CREATE SCHEMA public;");
        } catch (SQLException ex) {
            // fails tests ASAP
            throw new RuntimeException(ex); //NOPMD
        }
    }

    /**
     * ENv := Default static env + wegas.properties file + extraEnv
     *
     * @param extraEnv
     *
     * @throws IOException
     */
    public static final void initEnv(Map<String, String> extraEnv) throws IOException {

        try (InputStream is = Files.newInputStream(Path.of(PROPERTIES_PATH))) {
            PropertyResourceBundle properties = new PropertyResourceBundle(is);
            for (String k : properties.keySet()) {
                env.put(k, properties.getString(k));
            }
        }

        if (extraEnv != null) {
            env.putAll(extraEnv);
        }
        env.forEach(System::setProperty);
    }

    public static final WegasRuntime boot(Boolean resetDb) throws BootstrapException, IOException {
        if (!init) {
            initEnv(null);
        }

        WegasRuntime wr = new WegasRuntime();

        if (resetDb != null && resetDb) {
            resetDB(System.getProperty(WEGAS_DB_NAME_KEY));
        }

        String root = "../wegas-app/";

        String warPath = root + "target/Wegas";

        File theWar = new File(warPath);

        PayaraMicroRuntime bootstrap = PayaraMicro.getInstance()
            .setMinHttpThreads(5)
            .setMaxHttpThreads(5)
//            .setPreBootHandler((cmdRunner) -> {
//                //TODO : http2 & managed exec service
//                cmdRunner.run("set", "...")
//            })
            .addDeploymentFile(theWar)
            .setHttpAutoBind(true)
            .setSslAutoBind(true)
            .bootStrap();

        String appName = bootstrap.getDeployedApplicationNames().iterator().next();
        Integer httpPort = bootstrap.getLocalDescriptor().getHttpPorts().get(0);
        String appUrl = bootstrap.getLocalDescriptor().getApplicationURLS().get(0).toString();

        logger.info("AppName: {}", appName);
        logger.info("Port: {}", httpPort);
        logger.info("URL: {}", appUrl);

        wr.setAppName(appName);
        wr.setBaseUrl("http://localhost:" + httpPort + "/" + appName);
        wr.setPayara(bootstrap);
        return wr;
    }

    public static void main(String... args) throws BootstrapException, IOException {
        try {

            File defaultProperties = new File("./src/main/resources/default_wegas.properties");

            File oriDefaultProperties = new File("./src/main/resources/default_wegas.properties.orig");
            File properties = new File(PROPERTIES_PATH);

            if (properties.exists()) {
                try {
                    // try to patch
                    List<String> oriLines = Files.readAllLines(oriDefaultProperties.toPath());
                    List<String> modLines = Files.readAllLines(defaultProperties.toPath());
                    List<String> targetLines = Files.readAllLines(properties.toPath());

                    Patch<String> patch = DiffUtils.diff(oriLines, modLines);

                    List<String> result = patch.applyTo(targetLines);
                    Files.write(properties.toPath(), result);

                } catch (PatchFailedException ex) {
                    logger.info("Failed to patch {}! Please edit it manually", properties.getAbsolutePath());
                    return;
                } catch (DiffException ex) {
                    logger.info("Failed to diff {}! Please edit it manually", properties.getAbsolutePath());
                    return;
                } finally {
                    Files.copy(defaultProperties.toPath(), oriDefaultProperties.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }

            } else {
                // Copy
                Files.copy(defaultProperties.toPath(), oriDefaultProperties.toPath(), StandardCopyOption.REPLACE_EXISTING);
                Files.copy(defaultProperties.toPath(), properties.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            logger.info("Failed to read some file: {}", ex);
            logger.error("Abort");
            return;
        }

        WegasRuntime payara1 = WegasRuntime.boot(false);

        Runtime.getRuntime()
            .addShutdownHook(new Thread() {
                @Override
                public void run() {
                    logger.info("Shutdown Hook");
                    try {
                        if (payara1 != null) {
                            payara1.getPayara().shutdown();
                        }

                        //if (payara2 != null) {
                        //payara2.getPayara().shutdown();
                        //}
                    } catch (BootstrapException ex) {
                        logger.info("Shutdown failed with {}", ex);
                    }
                }
            });

        logger.info("Running");
    }
}
