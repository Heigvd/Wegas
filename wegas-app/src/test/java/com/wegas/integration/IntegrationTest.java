/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.integration;

import com.wegas.utils.TestHelper;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import junit.framework.Assert;
import net.sourceforge.jwebunit.junit.JWebUnit;
import static net.sourceforge.jwebunit.junit.JWebUnit.*;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpMessage;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.FileEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.glassfish.embeddable.BootstrapProperties;
import org.glassfish.embeddable.Deployer;
import org.glassfish.embeddable.GlassFish;
import org.glassfish.embeddable.GlassFishException;
import org.glassfish.embeddable.GlassFishProperties;
import org.glassfish.embeddable.GlassFishRuntime;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class IntegrationTest {

    private static GlassFish glassfish;
    private static String appName;
    private HttpClient client;

    private String cookie;
    private String baseURL;
    private Long artosId;

    @BeforeClass
    public static void setUpClass() throws Exception {
        BootstrapProperties bootstrapProperties = new BootstrapProperties();

        GlassFishProperties glassfishProperties = new GlassFishProperties();
        glassfishProperties.setPort("http-listener-1", 5454);
        glassfishProperties.setPort("http-listener-2", 5353);
        //glassfishProperties.setInstanceRoot("./src/test/glassfish/domains/domain1");
        glassfishProperties.setConfigFileURI((new File("./src/test/glassfish/domains/domain1/config/domain.xml")).toURI().toString());
        //glassfishProperties.setConfigFileReadOnly(false);
        TestHelper.resetTestDB();
        glassfish = GlassFishRuntime.bootstrap(bootstrapProperties).newGlassFish(glassfishProperties);
        Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);
        glassfish.start();

        File war = new File("./target/Wegas.war");
        Deployer deployer = glassfish.getDeployer();
        appName = deployer.deploy(war);

    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        if (glassfish != null) {
            Deployer deployer = glassfish.getDeployer();
            if (deployer != null) {
                deployer.undeploy(appName);
            }
            glassfish.dispose();
        }
    }

    @Before
    public void setUp() throws IOException, JSONException {
        client = HttpClientBuilder.create().build();
        baseURL = "http://localhost:5454/Wegas";
        setBaseUrl(baseURL);

        login();
        loadArtos();
    }

    public void login() throws IOException {
        HttpPost post = new HttpPost(baseURL + "/rest/User/Authenticate");
        String content = "{\"@class\" : \"AuthenticationInformation\","+
                "\"login\": \"root@root.com\"," +
                "\"password\": \"1234\"," +
                "\"remember\": \"true\"" +
                "}";

        StringEntity strEntity = new StringEntity(content);
        strEntity.setContentType("application/json");
        post.setEntity(strEntity);

        HttpResponse loginResponse = client.execute(post);

        Assert.assertEquals(HttpStatus.SC_OK, loginResponse.getStatusLine().getStatusCode());

        Header[] headers = loginResponse.getHeaders("Set-Cookie");
        if (headers.length > 0) {
            cookie = headers[0].getValue();
        }
    }

    private void loadArtos() throws IOException, JSONException {
        String postJSONFromFile = postJSONFromFile("/rest/GameModel", "src/main/webapp/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json");
        JSONObject jsonObject = new JSONObject(postJSONFromFile);
        JSONArray jsonArray = jsonObject.getJSONArray("entities");
        this.artosId = jsonArray.getJSONObject(0).getLong("id");
    }

    private void setHeaders(HttpMessage msg) {
        msg.setHeader("Content-Type", "application/json");
        msg.setHeader("Accept", "*/*");
        msg.setHeader("Cookie", cookie);
        msg.setHeader("Managed-Mode", "true");
    }

    private String getEntityAsString(HttpEntity entity) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        entity.writeTo(baos);
        return baos.toString("UTF-8");
    }

    private String httpGetAsJSON(String url) throws IOException {
        HttpUriRequest get = new HttpGet(baseURL + url);
        setHeaders(get);

        HttpResponse response = client.execute(get);

        Assert.assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());

        return getEntityAsString(response.getEntity());
    }

    /**
     *
     * @return
     */
    private String postJSON(String url, String jsonContent) throws IOException {
        HttpPost post = new HttpPost(baseURL + url);
        setHeaders(post);

        StringEntity strEntity = new StringEntity(jsonContent);
        strEntity.setContentType("application/json");
        post.setEntity(strEntity);

        HttpResponse response = client.execute(post);
        Assert.assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());

        return getEntityAsString(response.getEntity());
    }

    private String postJSONFromFile(String url, String jsonFile) throws IOException {
        HttpPost post = new HttpPost(baseURL + url);
        setHeaders(post);

        FileEntity fileEntity = new FileEntity(new File(jsonFile));
        fileEntity.setContentType("application/json");
        post.setEntity(fileEntity);

        HttpResponse response = client.execute(post);
        Assert.assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());

        return getEntityAsString(response.getEntity());

    }

    @Test
    public void abstractAssignTest() throws IOException, JSONException {
        JSONObject artosJson = new JSONObject(httpGetAsJSON("/rest/GameModel/" + this.artosId + "/VariableDescriptor"));
        artosJson.getJSONArray("entities");
    }

    @Test
    public void manageModeTest() throws IOException, JSONException {
        JSONObject json = new JSONObject(httpGetAsJSON("/rest/GameModel"));
        json.get("@class");
    }

    @Test
    public void hello() throws GlassFishException, IOException {
        //java.lang.System.setProperty("org.apache.commons.logging.simplelog.defaultlog", "debug");
        //beginAt("test.htm");
        //assertTitleEquals("My Page");
        try {
            beginAt("login.html?debug=true");
        } catch (NullPointerException e) {  //@fixme error using xmlhttprequest from jwebunit
            System.out.println("Jweb unit encountered an exception");
            // e.printStackTrace();
        }
        assertResponseCode(200);
        assertTitleEquals("Web Game Authoring System - Wegas");

        //tester.setTextField("username", "root@root.com");
        //tester.setTextField("password", "test123");
        //tester.clickLink("login");
        //tester.submit();
    }

    @Test
    public void testJavascript() {
        JWebUnit.setScriptingEnabled(true);
        beginAt("wegas-app/tests/wegas-alltests.htm");
        assertTitleEquals("Wegas Test Suite");
    }
}
