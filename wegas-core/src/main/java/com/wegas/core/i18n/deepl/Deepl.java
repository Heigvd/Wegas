/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.deepl;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.ws.rs.core.MediaType;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * DeepL Pro Client.
 *
 * @author maxence
 */
public class Deepl {

    private static final Logger logger = LoggerFactory.getLogger(Deepl.class);

    /**
     * DeepL API URL
     */
    private final String baseUrl;

    /**
     * Private authentication key
     */
    private final String key;

    private HttpClient client;

    /**
     * Create a DeepL Pro client.
     *
     * @param url    api url
     * @param apiKey authentication key
     */
    public Deepl(String url, String apiKey) {
        this.key = apiKey;
        this.client = HttpClientBuilder.create().build();
        this.baseUrl = url;
        Helper.getWegasProperty("deepl.base_url", "https://apideepl.com/v1/");
    }

    /**
     * List of language supported by DeepL.
     */
    public static enum Language {
        /**
         * English
         */
        EN,
        /**
         * German
         */
        DE,
        /**
         * French
         */
        FR,
        /**
         * Spanish
         */
        ES,
        /**
         * Italian
         */
        IT,
        /**
         * Dutch
         */
        NL,
        /**
         * Polish
         */
        PL;
    }

    /**
     * Consume httpEntity to String.
     *
     * @param entity HttpEntiy from the http response
     *
     * @return string representation of the given entity
     *
     * @throws IOException input problem
     */
    private String getEntityAsString(HttpEntity entity) throws IOException {
        if (entity != null) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            entity.writeTo(baos);
            return baos.toString("UTF-8");
        } else {
            return "";
        }
    }

    /**
     * Retrieve your current consumption.
     *
     * @return DeepL usage response.
     */
    public DeeplUsage usage() {
        StringBuilder sb = new StringBuilder();
        sb.append("auth_key=").append(this.key);

        return this.post(sb.toString(), "/usage", DeeplUsage.class);
    }

    /**
     * Internal method to post a request.
     * Will parse the response as a valueType instance.
     *
     * @param <T>       response type
     * @param body      content to post
     * @param url       API endpoint
     * @param valueType
     *
     * @return
     */
    private <T> T post(String body, String url, Class<T> valueType) {

        HttpPost request = new HttpPost(baseUrl + url);

        StringEntity entity = new StringEntity(body, StandardCharsets.UTF_8);
        entity.setContentType(MediaType.APPLICATION_FORM_URLENCODED + ";charset=UTF-8");

        request.setEntity(entity);

        try {
            HttpResponse httpResponse = client.execute(request);
            StatusLine statusLine = httpResponse.getStatusLine();
            String response = getEntityAsString(httpResponse.getEntity());

            if (statusLine.getStatusCode() == 200) {
                return JacksonMapperProvider.getMapper().readValue(response, valueType);
            } else {
                throw WegasErrorMessage.error(response);
            }
        } catch (IOException ex) {
            throw WegasErrorMessage.error(ex.toString());
        }
    }

    /**
     * DeepL translate
     *
     * @param sourceLang texts are in this language. Null means autodetect
     * @param targetLang translate to this language. Mandatory
     * @param texts      list of texts to translate
     *
     * @return
     */
    public DeeplTranslations translate(Language sourceLang, Language targetLang, String... texts) throws UnsupportedEncodingException {

        StringBuilder sb = new StringBuilder();
        sb.append("auth_key=").append(this.key);
        sb.append("&tag_handling=xml").append(this.key);
        if (sourceLang != null) {
            sb.append("&source_lang=").append(sourceLang);
        }

        if (targetLang != null) {
            sb.append("&target_lang=").append(targetLang);
        } else {
            //TODO else : throw error
        }

        if (texts != null) {
            for (String text : texts) {
                sb.append("&text=").append(URLEncoder.encode(text, "UTF-8"));
            }
        } else {
            //TODO else : throw error
        }
        return this.post(sb.toString(), "/translate", DeeplTranslations.class);
    }
}
