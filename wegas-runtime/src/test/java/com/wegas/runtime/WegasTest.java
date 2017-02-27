package com.wegas.runtime;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import net.sourceforge.jwebunit.junit.JWebUnit;
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
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class WegasTest {

    private static final String WEGAS_ROOT_DIR = "../wegas-app/";

    private static Wegas.WegasRuntime runtime;

    private HttpClient client;

    private String cookie;

    private String baseURL;

    private Long artosId;

    private static Logger logger = LoggerFactory.getLogger(WegasTest.class);

    @BeforeClass
    public static void setUpClass() throws Exception {
        runtime = Wegas.boot("wegas_test", "localhost", null, true);
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        Wegas.shutdown(runtime);
    }

    @Before
    public void setUp() throws IOException, JSONException {
        client = HttpClientBuilder.create().build();

        baseURL = runtime.getBaseUrl();
        JWebUnit.setBaseUrl(baseURL);

        login();
        loadArtos();
    }

    public void login() throws IOException {
        HttpPost post = new HttpPost(baseURL + "/rest/User/Authenticate");
        String content = "{\"@class\" : \"AuthenticationInformation\","
                + "\"login\": \"root@root.com\","
                + "\"password\": \"1234\","
                + "\"remember\": \"true\""
                + "}";

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
        String postJSONFromFile = postJSONFromFile("/rest/GameModel", WEGAS_ROOT_DIR + "src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json");
        JSONObject jsonObject = new JSONObject(postJSONFromFile);
        JSONArray jsonArray = jsonObject.getJSONArray("updatedEntities");
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
    public void testUpdateAndCreateGame() throws IOException, JSONException {
        String postJSONFromFile = postJSONFromFile("/rest/GameModel", WEGAS_ROOT_DIR + "src/test/resources/gmScope.json");
        JSONObject jsonObject = new JSONObject(postJSONFromFile);
        JSONArray jsonArray = jsonObject.getJSONArray("updatedEntities");
        Long gmId = jsonArray.getJSONObject(0).getLong("id");

        postJSON("/rest/GameModel/" + gmId + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + gmId + "\",\"access\":\"OPEN\",\"name\":\"My Test Game\"}");
    }

    @Test
    public void createGameTest() throws IOException, JSONException {
        String postJSON = postJSON("/rest/GameModel/" + this.artosId + "/Game", "{\"@class\":\"Game\",\"gameModelId\":\"" + this.artosId + "\",\"access\":\"OPEN\",\"name\":\"My Artos Game\"}");
        JSONObject response = new JSONObject(postJSON);
        JSONArray entities = response.getJSONArray("updatedEntities");
        Long gameId = entities.getJSONObject(0).getLong("id");

        String httpGetAsJSON = httpGetAsJSON("/rest/GameModel/Game/" + gameId);

        response = new JSONObject(httpGetAsJSON);
        entities = response.getJSONArray("updatedEntities");

        JSONArray teams = (JSONArray) entities.getJSONObject(0).get("teams");

        /* Is the debug team present */
        Assert.assertEquals(1, teams.length());
        JSONArray players = teams.getJSONObject(0).getJSONArray("players");

        Assert.assertEquals(1, players.length());
    }

    @Test
    public void abstractAssignTest() throws IOException, JSONException {
        JSONObject artosJson = new JSONObject(httpGetAsJSON("/rest/GameModel/" + this.artosId + "/VariableDescriptor"));
        artosJson.getJSONArray("updatedEntities");
    }

    @Test
    public void manageModeTest() throws IOException, JSONException {
        JSONObject json = new JSONObject(httpGetAsJSON("/rest/GameModel"));
        json.get("@class");
    }

    @Test
    public void hello() throws IOException {
        //java.lang.System.setProperty("org.apache.commons.logging.simplelog.defaultlog", "debug");
        //assertTitleEquals("My Page");
        try {
            JWebUnit.beginAt("login.html?debug=true");
        } catch (NullPointerException e) {  //@fixme error using xmlhttprequest from jwebunit
            System.out.println("Jweb unit encountered an exception");
            // e.printStackTrace();
        }
        JWebUnit.assertResponseCode(200);
        JWebUnit.assertTitleEquals("Web Game Authoring System - Wegas");

        //tester.setTextField("username", "root@root.com");
        //tester.setTextField("password", "test123");
        //tester.clickLink("login");
        //tester.submit();
    }

    @Test
    public void testJavascript() {
        JWebUnit.setScriptingEnabled(true);
        JWebUnit.beginAt("wegas-app/tests/wegas-alltests.htm");
        JWebUnit.assertTitleEquals("Wegas Test Suite");
    }

}
