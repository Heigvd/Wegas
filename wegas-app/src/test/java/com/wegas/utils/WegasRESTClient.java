/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.utils;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AccountDetails;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.AuthenticationInformation;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpMessage;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.FileEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class WegasRESTClient {

    private static final Logger logger = LoggerFactory.getLogger(WegasRESTClient.class);

    private String cookie;

    private final HttpClient client;
    private final String baseURL;

    private static ObjectMapper getObjectMapper() {
        return JacksonMapperProvider.getMapper();
    }

    public WegasRESTClient(String baseURL) {
        this.client = HttpClientBuilder.create().build();
        this.baseURL = baseURL;
    }

    public String getBaseURL() {
        return baseURL;
    }

    public Map<String, Role> getRoles() throws IOException {
        Map<String, Role> roles = new HashMap<>();

        for (Role r : (List<Role>) get("/rest/Role", new TypeReference<List<Role>>() {
        })) {
            roles.put(r.getName(), r);
        }
        return roles;
    }

    public TestAuthenticationInformation signup(String email, String password) throws IOException {
        JpaAccount ja = new JpaAccount();
        ja.setUsername(email);
        ja.setFirstname(email);
        ja.setLastname(email);
        ja.setPassword(password);

        ja.setDetails(new AccountDetails());
        ja.getDetails().setEmail(email);

        String post_asString = this.post_asString("/rest/User/Signup", ja);
        TestAuthenticationInformation authInfo = getAuthInfo(email, password);
        User user = getObjectMapper().readValue(post_asString, User.class);
        authInfo.setUserId(user.getId());
        authInfo.setAccountId(user.getMainAccount().getId());

        return authInfo;
    }

    public TestAuthenticationInformation getAuthInfo(String username, String password) {
        TestAuthenticationInformation authInfo = new TestAuthenticationInformation();
        authInfo.setAgreed(Boolean.TRUE);
        authInfo.setLogin(username);
        authInfo.setPassword(password);
        authInfo.setRemember(true);

        return authInfo;
    }

    public void login(AuthenticationInformation authInfo) throws IOException {
        HttpResponse loginResponse = this._post("/rest/User/Authenticate", authInfo);
        HttpEntity entity = loginResponse.getEntity();
        EntityUtils.consume(entity);

        if (loginResponse.getStatusLine().getStatusCode() != HttpStatus.SC_OK) {
            throw WegasErrorMessage.error("Login failed");
        }

        Header[] headers = loginResponse.getHeaders("Set-Cookie");

        if (headers.length > 0) {
            cookie = headers[0].getValue();
        }
    }

    private void setHeaders(HttpMessage msg) {
        msg.setHeader("Content-Type", "application/json");
        msg.setHeader("Accept", "*/*");
        msg.setHeader("Cookie", cookie);
        msg.setHeader("Managed-Mode", "false");
    }

    private String getEntityAsString(HttpEntity entity) throws IOException {
        if (entity != null) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            entity.writeTo(baos);
            return baos.toString("UTF-8");
        } else {
            return "";
        }
    }

    public <T> T get(String url, TypeReference<T> valueTypeRef) throws IOException {
        String get = this.get(url);
        if (!Helper.isNullOrEmpty(get)) {
            return getObjectMapper().readValue(get, valueTypeRef);
        } else {
            return null;
        }
    }

    public <T> T get(String url, Class<T> valueType) throws IOException {
        String get = this.get(url);
        if (!Helper.isNullOrEmpty(get)) {
            return getObjectMapper().readValue(get, valueType);
        } else {
            return null;
        }
    }

    public String get(String url) throws IOException {
        logger.info("GET" + " " + url);
        HttpUriRequest get = new HttpGet(baseURL + url);
        setHeaders(get);

        HttpResponse response = client.execute(get);
        logger.info(" => " + response.getStatusLine());

        if (response.getStatusLine().getStatusCode() >= 300) {
            throw WegasErrorMessage.error("Expected 2xx OK but got " + response.getStatusLine().getStatusCode());
        }

        return getEntityAsString(response.getEntity());
    }

    public String put(String url) throws IOException {
        return this.put(url, null);
    }

    public String put(String url, Object object) throws IOException {
        HttpResponse response = this._put(url, object);
        return getEntityAsString(response.getEntity());
    }

    public <T> T put(String url, Object object, Class<T> valueType) throws IOException {
        String response = this.put(url, object);
        return getObjectMapper().readValue(response, valueType);
    }

    private HttpResponse _put(String url, Object object) throws IOException {
        return this.sendRequest(url, "PUT", (object != null ? getObjectMapper().writeValueAsString(object) : null));
    }

    public String post(String url, Object object) throws IOException {
        HttpResponse response = this._post(url, object);
        String entity = this.getEntityAsString(response.getEntity());
        if (response.getStatusLine().getStatusCode() >= 400) {
            throw WegasErrorMessage.error(entity);
        }
        return entity;
    }

    public <T> T post(String url, Object object, TypeReference<T> valueType) throws IOException {
        String post = this.post(url, object);
        if (!Helper.isNullOrEmpty(post)) {
            return getObjectMapper().readValue(post, valueType);
        } else {
            return null;
        }
    }

    public <T> T post(String url, Object object, Class<T> valueType) throws IOException {
        String post = this.post(url, object);
        if (!Helper.isNullOrEmpty(post)) {
            return getObjectMapper().readValue(post, valueType);
        } else {
            return null;
        }
    }

    private HttpResponse _post(String url, Object object) throws IOException {
        return this.sendRequest(url, "POST", (object != null ? getObjectMapper().writeValueAsString(object) : null));
    }

    private String post_asString(String url, Object object) throws IOException {
        String strObject = getObjectMapper().writeValueAsString(object);
        return this.postJSON_asString(url, strObject);
    }

    public String delete(String url) throws IOException {
        logger.info("DELETE " + url);
        HttpUriRequest delete = new HttpDelete(baseURL + url);
        setHeaders(delete);

        HttpResponse response = client.execute(delete);

        logger.info(" => " + response.getStatusLine());

        if (response.getStatusLine().getStatusCode() >= HttpStatus.SC_BAD_REQUEST) {
            throw WegasErrorMessage.error("DELETE failed");
        }

        return getEntityAsString(response.getEntity());

    }

    private HttpResponse sendRequest(String url, String method, String jsonContent) throws IOException {
        HttpEntityEnclosingRequestBase request = null;
        switch (method) {
            case "POST":
                request = new HttpPost(baseURL + url);
                break;
            case "PUT":
                request = new HttpPut(baseURL + url);
                break;
        }

        if (request != null) {
            setHeaders(request);

            logger.info(method + " " + baseURL + url + " WITH " + jsonContent);
            if (jsonContent != null) {
                StringEntity strEntity = new StringEntity(jsonContent, "UTF-8");
                request.setEntity(strEntity);
            }

            HttpResponse execute = client.execute(request);
            logger.info(" => " + execute.getStatusLine());

            return execute;
        } else {
            throw WegasErrorMessage.error("Method not allowed");
        }
    }

    public <T> T postJSON_asString(String url, String jsonContent, Class<T> valueType) throws IOException {
        String postJSON_asString = this.postJSON_asString(url, jsonContent);
        if (!Helper.isNullOrEmpty(postJSON_asString)) {
            return getObjectMapper().readValue(postJSON_asString, valueType);
        } else {
            return null;
        }
    }

    public String postJSON_asString(String url, String jsonContent) throws IOException {
        HttpResponse response = this.sendRequest(url, "POST", jsonContent);

        return getEntityAsString(response.getEntity());
    }

    public <T> T postJSONFromFile(String url, String jsonFile, Class<T> valueType) throws IOException {
        String postJSONFromFile = this.postJSONFromFile(url, jsonFile);
        if (!Helper.isNullOrEmpty(postJSONFromFile)) {
            return getObjectMapper().readValue(postJSONFromFile, valueType);
        } else {
            return null;
        }
    }

    public String postJSONFromFile(String url, String jsonFile) throws IOException {
        HttpPost post = new HttpPost(baseURL + url);
        setHeaders(post);

        FileEntity fileEntity = new FileEntity(new File(jsonFile));
        fileEntity.setContentType("application/json");
        post.setEntity(fileEntity);

        HttpResponse response = client.execute(post);

        if (response.getStatusLine().getStatusCode() != HttpStatus.SC_OK) {
            throw WegasErrorMessage.error("POST failed");
        }

        return getEntityAsString(response.getEntity());

    }

    @JsonTypeName("AuthenticationInformation")
    public static class TestAuthenticationInformation extends AuthenticationInformation {

        @JsonIgnore
        private Long userId;

        @JsonIgnore
        private Long accountId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getAccountId() {
            return accountId;
        }

        public void setAccountId(Long accountId) {
            this.accountId = accountId;
        }

    }
}
