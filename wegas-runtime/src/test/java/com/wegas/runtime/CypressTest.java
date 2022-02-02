package com.wegas.runtime;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import org.junit.Assert;
import org.slf4j.Logger;

/**
 *
 * @author maxence
 * @author P-B
 */
public class CypressTest {

    private String WEGAS_URL_1;
    private String ADMIN_USERNAME ;
    private String ADMIN_EMAIL;
    private String ADMIN_PASSWORD;
    private Logger logger;


    public CypressTest( String url, String username, String email, String password, Logger logger ){
        this.WEGAS_URL_1 = url;
        this.ADMIN_USERNAME = username;
        this.ADMIN_EMAIL = email;
        this.ADMIN_PASSWORD = password;
        this.logger = logger;
        verifyCypress();
        cypressSuiteTest();
    }


 /**
     * Test application with cypress
     */
    private void verifyCypress() {
        logger.info("Verifying Cypress");
        try {
            String cypressCommand = "yarn cypress verify" ;

            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");

            ProcessBuilder builder = new ProcessBuilder();
            if (isWindows) {
                builder.command("cmd.exe", "/c", cypressCommand);
            } else {
                builder.command("sh", "-c", cypressCommand);
            }

            Path cypressPath = Paths.get("src", "test", "node");

            builder.directory(cypressPath.toFile());

            Process process = builder.start();
            //make sure to consume output
            StreamGobbler streamGobbler
                = new StreamGobbler(process.getInputStream(), System.out::println);

            Executors.newSingleThreadExecutor().submit(streamGobbler);

            int exitCode = process.waitFor();

            Assert.assertEquals(0, exitCode);
        } catch (IOException ex) {
            Assert.fail("Run cypress failed with : " + ex.getMessage() );
        } catch (InterruptedException ex) {
            Assert.fail("Cypress has been interrupted : " + ex.getMessage());
        }
    }

    /**
     * Test application with cypress
     */
    private void cypressSuiteTest() {
        logger.info(("Launching tests with Cypress"));
        try {
            Map<String, String> env = new HashMap<>();

            env.put("WEGAS_URL", this.WEGAS_URL_1);
            env.put("ADMIN_USERNAME", this.ADMIN_USERNAME);
            env.put("ADMIN_EMAIL", this.ADMIN_EMAIL);
            env.put("ADMIN_PASSWORD", this.ADMIN_PASSWORD);

            String envOpt = env.entrySet().stream()
                .map(entry -> entry.getKey()+ "=" +entry.getValue())
                .collect(Collectors.joining(","));


            boolean interractive = System.getProperty("cypress", "false").equals("true");

            String cypressSubcommand = interractive ? "open" : "run";

            String cypressCommand = "yarn cypress " + cypressSubcommand + " --env " +envOpt;

            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");

            ProcessBuilder builder = new ProcessBuilder();
            if (isWindows) {
                builder.command("cmd.exe", "/c", cypressCommand);
            } else {
                builder.command("sh", "-c", cypressCommand);
            }

            Path cypressPath = Paths.get("src", "test", "node");

            builder.directory(cypressPath.toFile());

            Process process = builder.start();
            //make sure to consume output
            StreamGobbler streamGobbler
                = new StreamGobbler(process.getInputStream(), System.out::println);

            Executors.newSingleThreadExecutor().submit(streamGobbler);

            int exitCode = process.waitFor();

            Assert.assertEquals(0, exitCode);
        } catch (IOException ex) {
            Assert.fail("Run cypress failed with : " + ex.getMessage() );
        } catch (InterruptedException ex) {
            Assert.fail("Cypress has been interrupted : " + ex.getMessage());
        }
    }


    private static class StreamGobbler implements Runnable {

        private final InputStream inputStream;
        private final Consumer<String> consumer;

        public StreamGobbler(InputStream inputStream, Consumer<String> consumer) {
            this.inputStream = inputStream;
            this.consumer = consumer;
        }

        @Override
        public void run() {
            new BufferedReader(new InputStreamReader(inputStream)).lines()
                .forEach(consumer);
        }
    }

}
