package com.wegas.wegas.runtime;

//import com.wegas.core.Helper;
import fish.payara.appserver.micro.services.data.InstanceDescriptor;
import fish.payara.micro.BootstrapException;
import fish.payara.micro.PayaraMicro;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Collection;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    private static final Logger logger = LoggerFactory.getLogger(Wegas.class);

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

        private PayaraMicro payara;
        private String appName;
        private String baseUrl;
        private File domainConfig;

        public WegasRuntime() {
        }

        public PayaraMicro getPayara() {
            return payara;
        }

        public void setPayara(PayaraMicro payara) {
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

    public static WegasRuntime boot(String dbName, String dbHost, Integer nbThreads, Boolean resetDB) throws BootstrapException, IOException {
        System.setProperty(WEGAS_DB_HOST_KEY, dbHost != null ? dbHost : WEGAS_DB_HOST_DEFAULTVALUE);
        System.setProperty(WEGAS_DB_NAME_KEY, dbName != null ? dbName : WEGAS_DB_NAME_DEFAULTVALUE);
        System.setProperty(WEGAS_HTTP_THREADS_KEY, nbThreads != null ? nbThreads.toString() : WEGAS_HTTP_THREADS_DEFAULTVALUE);

        WegasRuntime env = new WegasRuntime();

        String root = "../wegas-app";

        File domainConfig = new File(root + "/src/test/resources/microdomain.xml");
        File explodedDir = new File(root + "/target/Wegas");

        // PayaraMicro will rewrite the domain.xml file, we do not want such a behaviour so let make a temp copy
        File tmpDomainConfig = File.createTempFile("microdomain", "xml");

        FileUtils.copyFile(domainConfig, tmpDomainConfig);

        //File rootDir = new File("./src/test/glassfish/domains/domain1");
        PayaraMicro payara = PayaraMicro.getInstance();

        payara.setAlternateDomainXML(tmpDomainConfig);
        payara.setHzClusterName("hz-WegasIntegrationTest");

        if (resetDB != null && resetDB) {
            resetDB(dbName);
        }

        //payara.setHttpPort(port);
        payara.setHttpAutoBind(true);
        payara.bootStrap();
        payara.getRuntime().deploy(explodedDir);

        /* Onve wegas has been loader, we can use reflection to access Helper */
        //ClassLoader classLoader = payara.setThreadBootstrapLoader();
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

        Class<?> helper;
        try {
            helper = classLoader.loadClass("com.wegas.core.Helper");
            Method setEnv = helper.getMethod("setWegasRootDirectory", String.class);
            File appDirectory = new File(root + "/target/Wegas/");
            setEnv.invoke(appDirectory.getAbsolutePath());
        } catch (ClassNotFoundException | IllegalAccessException | IllegalArgumentException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
        }

        String appName = payara.getRuntime().getDeployedApplicationNames().iterator().next();

        Integer port = null;
        String hostname = null;

        Collection<InstanceDescriptor> clusteredPayaras = payara.getRuntime().getClusteredPayaras();
        for (InstanceDescriptor instance : clusteredPayaras) {
            port = instance.getHttpPorts().get(0);
            hostname = instance.getHostName().getHostAddress();
            break;
        }

        String baseURL = "http://" + hostname + ":" + port + "/" + appName;

        env.setAppName(dbName);
        env.setDomainConfig(tmpDomainConfig);
        env.setPayara(payara);
        env.setBaseUrl(baseURL);
        logger.error(env.toString());

        return env;
    }

    public static void main(String... args) throws BootstrapException, IOException, InterruptedException {
        WegasRuntime boot = Wegas.boot("wegas_dev", "localhost", 5, false);

        Thread.currentThread().wait();

        Wegas.shutdown(boot);
    }

    public static void shutdown(WegasRuntime runtime) throws BootstrapException {
        PayaraMicro payara = runtime.getPayara();
        if (payara != null) {
            String appName = runtime.getAppName();
            payara.getRuntime().undeploy(appName);
            payara.shutdown();
        }
        runtime.getDomainConfig().delete();
    }

}
