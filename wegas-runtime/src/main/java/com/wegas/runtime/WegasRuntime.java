/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.runtime;

import fish.payara.micro.BootstrapException;
import fish.payara.micro.PayaraMicro;
import fish.payara.micro.PayaraMicroRuntime;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import org.apache.commons.io.FileUtils;
//import org.apache.commons.io.FileUtils;

/**
 * Main class to run Wegas
 *
 * @author maxence
 */
public class WegasRuntime {

    private static final Map<String, String> env;

    public static final String WEGAS_DB_NAME_KEY = "wegas.db.name";
    public static final String WEGAS_DB_HOST_KEY = "wegas.db.host";
    public static final String WEGAS_HTTP_THREADS_KEY = "wegas.http.threads";
    public static final String WEGAS_HTTP_POPULATORS_KEY = "wegas.nb_populators";
    public static final String CACHE_COORDINATION_PROTOCOL = "eclipselink.cache.coordination.protocol";
    public static final String CACHE_COORDINATION_CHANNEL = "eclipselink.cache.coordination.channel";

    private PayaraMicroRuntime payara;
    private String appName;
    private String baseUrl;
    private File domainConfig;

    private static boolean init = false;

    static {
        env = new HashMap<>();

        env.put(WEGAS_DB_NAME_KEY, "wegas_dev");
        env.put(WEGAS_DB_HOST_KEY, "localhost");
        env.put(WEGAS_HTTP_THREADS_KEY, "5");
        env.put(WEGAS_HTTP_POPULATORS_KEY, "3");
        env.put(CACHE_COORDINATION_PROTOCOL, "fish.payara.persistence.eclipselink.cache.coordination.HazelcastPublishingTransportManager");
        env.put(CACHE_COORDINATION_CHANNEL, "TODO_RANDOMIZE");
    }

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

    public static final void initEnv(Map<String, String> extraEnv) {
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

        File domainConfig = new File("./src/main/resources/domain.xml");
        File tmpDomainConfig = File.createTempFile("domain", ".xml");

        FileUtils.copyFile(domainConfig, tmpDomainConfig);

        String warPath = root + "target/Wegas";
        warPath = "/home/maxence/Projects/Payara-Examples/payara-micro/payara-micro-examples/target/payara-micro-examples-1.0-SNAPSHOT.war";

        warPath = "/home/maxence/Projects/EmptyWar/target/EmptyWar-0.1-SNAPSHOT.war";

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

    /**
     * https://github.com/paoloantinori/custom-classloader/
     */
    public static class MyClassLoader extends URLClassLoader {

        private ClassLoader realParent;

        public MyClassLoader(URL[] urls, ClassLoader realParent) {
            // pass null as parent so upward delegation disabled for first
            // findClass call
            super(urls, null);

            this.realParent = realParent;
        }

        @Override
        public Class<?> findClass(String name) throws ClassNotFoundException {
            try {
                // first try to use the URLClassLoader findClass
                return super.findClass(name);
            } catch (ClassNotFoundException e) {
                // if that fails, ask real parent classloader to load the
                // class (give up)
                return realParent.loadClass(name);
            }
        }
    }

    public static void main(String... args) throws BootstrapException, IOException, InterruptedException, ExecutionException, ClassNotFoundException, NoSuchMethodException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {

//        Callable<Object> runPayara = () -> {
//            ClassLoader thatClassLoader = Thread.currentThread().getContextClassLoader();
//            URLClassLoader urlClassLoader = (URLClassLoader) thatClassLoader;
//            try {
//                MyClassLoader myClassLoader = new MyClassLoader(urlClassLoader.getURLs(), thatClassLoader);
//                Thread.currentThread().setContextClassLoader(thatClassLoader);
//                return myClassLoader
//                        .loadClass("com.wegas.runtime.WegasRuntime")
//                        .getMethod("boot", Boolean.class)
//                        .invoke(null, false);
//            } finally {
//                Thread.currentThread().setContextClassLoader(thatClassLoader);
//            }
//        };
//
//        ForkJoinPool pool1 = new ForkJoinPool();
//        ForkJoinTask<Object> submit1 = pool1.submit(runPayara);
//        Object payara1 = submit1.get();
//
//        ForkJoinPool pool2 = new ForkJoinPool();
//        ForkJoinTask<Object> submit2 = pool2.submit(runPayara);
//        Object payara2 = submit2.get();
        WegasRuntime payara1 = WegasRuntime.boot(false);

        Runtime.getRuntime()
                .addShutdownHook(new Thread() {
                    @Override
                    public void run() {
                        System.out.println("Shutdown Hook");
                        try {
                            if (payara1 != null) {
                                payara1.getPayara().shutdown();
                            }

                            //if (payara2 != null) {
                            //payara2.getPayara().shutdown();
                            //}
                        } catch (BootstrapException ex) {
                            System.out.println("Shutdown failed with " + ex);
                        }
                    }
                });

        System.out.println("Running");
    }
}
