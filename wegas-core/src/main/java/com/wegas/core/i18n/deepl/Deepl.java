/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.deepl;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import jakarta.ws.rs.core.MediaType;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;

/**
 * DeepL Pro Client.
 *
 * @author maxence
 */
public class Deepl {

    //private static final Logger logger = LoggerFactory.getLogger(Deepl.class);
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
        this.baseUrl = url;
        this.key = apiKey;
        this.client = HttpClientBuilder.create().build();
    }

    /**
     * List of languages supported by DeepL.
     */
    public enum Language {
        /**
         * Bulgarian
         */
        BG,
        /**
         * Czech
         */
        CS,
        /**
         * Danish
         */
        DA,
        /**
         * German
         */
        DE,
        /**
         * Greek
         */
        EL,
        /**
         * English
         */
        EN,
        /**
         * Spanish
         */
        ES,
        /**
         * Estonian
         */
        ET,
        /**
         * Finnish
         */
        FI,
        /**
         * French
         */
        FR,
        /**
         * Hungarian
         */
        HU,
        /**
         * Italian
         */
        IT,
        /**
         * Japanese
         */
        JA,
        /**
         * Latvian
         */
        LV,
        /**
         * Lithuanian
         */
        LT,
        /**
         * Dutch
         */
        NL,
        /**
         * Polish
         */
        PL,
        /**
         * Portuguese
         */
        PT,
        /**
         * Romanian
         */
        RO,
        /**
         * Russian
         */
        RU,
        /**
         * Slovak
         */
        SK,
        /**
         * Slovenian
         */
        SL,
        /**
         * Swedish
         */
        SV,
        /**
         * Chinese
         */
        ZH,

    }

    /**
     * Consume httpEntity to String.
     *
     * @param entity HttpEntity from the http response
     *
     * @return string representation of the given entity
     *
     * @throws IOException input problem
     */
    private String getEntityAsString(HttpEntity entity) throws IOException {
        if (entity != null) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            entity.writeTo(baos);
            return baos.toString(StandardCharsets.UTF_8);
        } else {
            return "";
        }
    }

    /**
     * Internal method to post a request. Will parse the response as a valueType instance.
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

        request.setHeader("Authorization", "DeepL-Auth-Key " + this.key);

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
     * Retrieve your current consumption.
     *
     * @return DeepL usage response.
     */
    public DeeplUsage usage() {
        return this.post("", "/usage", DeeplUsage.class);
    }

    /**
     * DeepL translate
     *
     * @param sourceLang texts are in this language. Null means autodetect
     * @param targetLang translate to this language. Mandatory
     * @param texts      list of texts to translate
     *
     * @return
     *
     * @throws java.io.UnsupportedEncodingException
     */
    public DeeplTranslations translate(Language sourceLang, Language targetLang, String... texts) throws UnsupportedEncodingException {

        StringBuilder sb = new StringBuilder();
        sb.append("&tag_handling=xml");
        if (sourceLang != null) {
            sb.append("&source_lang=").append(sourceLang);
        }

        if (targetLang != null) {
            sb.append("&target_lang=").append(targetLang);
            /*} else {
            //TODO else : throw error*/
        }

        if (texts != null) {
            for (String text : texts) {
                sb.append("&text=").append(URLEncoder.encode(text, "UTF-8"));
            }
            /*} else {
            //TODO else : throw error*/
        }

        /* hack <p></p> => <p>&nbsp;</p> */
        DeeplTranslations translations = this.post(sb.toString(), "/translate", DeeplTranslations.class);

        for (DeeplTranslations.DeeplTranslation tr : translations.getTranslations()) {
            String text = tr.getText();
            if (text != null) {
                tr.setText(text.replaceAll("<p></p>", "<p>&nbsp;</p>"));
            }
        }

        return translations;
    }
}
