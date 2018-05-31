/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.JsonPatchException;
import com.wegas.core.Helper;
import java.io.IOException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class Page {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Page.class);

    static final protected String INDEX_KEY = "index";

    static final protected String NAME_KEY = "pageName";

    private static ObjectMapper mapper = null;

    private String id;

    private JsonNode content;

    private String name;

    private Integer index = 0;

    /**
     * @param id
     * @param content
     */
    public Page(String id, JsonNode content) {
        this.id = id;
        this.setContent(content.deepCopy());
    }

    /**
     * @param n
     *
     * @throws RepositoryException
     * @throws IOException
     */
    public Page(Node n) throws RepositoryException {
        this.id = n.getName();
        this.setContent(n.getProperty("content").getString());
        if (n.hasProperty(NAME_KEY)) {
            this.name = n.getProperty(NAME_KEY).getString();
        }
        if (n.hasProperty(INDEX_KEY)) {
            this.index = Helper.longToInt(n.getProperty(INDEX_KEY).getLong());
        }
    }

    /**
     *
     */
    public Page() {
    }

    /**
     * @return page id
     */
    public String getId() {
        return id;
    }

    /**
     * @param id
     */
    public void setId(String id) {
        this.id = id;
    }

    /**
     * @return page content as a JSONNode
     */
    public JsonNode getContent() {
        return content;
    }

    public JsonNode getContentWithMeta() {
        ObjectNode content = this.content.deepCopy();
        content.put("@name", this.name);
        content.put("@index", this.index);
        return content;
    }

    /**
     * @param content
     */
    @JsonIgnore
    public final void setContent(JsonNode content) {
        this.content = content;
        this.extractAttrs();
    }

    private static synchronized ObjectMapper getMapper() {
        if (Page.mapper == null) {
            Page.mapper = new ObjectMapper();
        }
        return Page.mapper;
    }

    /**
     * @param content
     *
     * @throws IOException
     */
    @JsonIgnore
    public final void setContent(String content) {
        try {
            this.content = getMapper().readTree(content);
            this.extractAttrs();
        } catch (IOException e) {

        }
    }

    /**
     * @return page name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     */
    @JsonIgnore
    private void extractAttrs() {
        JsonNode node;
        node = this.content.path("@name");
        if (!node.isMissingNode()) {
            this.name = node.textValue();
            ((ObjectNode) this.content).remove("@name");
        }
        node = this.content.path("@index");
        if (!node.isMissingNode()) {
            this.index = node.intValue();
            ((ObjectNode) this.content).remove("@index");
        }
    }

    /**
     * @param patch RFC6902: patch Array
     */
    public void patch(JsonNode patch) throws IOException, JsonPatchException {
        final JsonNode target = JsonPatch.fromJson(patch).apply(this.getContentWithMeta());
        logger.info("INPUT\n" + this.content.toString() + "\nPATCH\n" + patch + "\nRESULT\n" + target.asText());
        this.setContent(target);
    }

    //@TODO : tokenizer
    /**
     * @param jsonPath
     *
     * @return  some extracted node as text
     */
    public String extract(String jsonPath) {
        JsonNode node = this.content;
        final String[] xpaths = jsonPath.trim().split("\\.|\\[|\\]");
        for (String xpath : xpaths) {
            if (!xpath.equals("")) {
                if (node.isArray() && xpath.matches("[0-9]+")) {
                    node = node.path(Integer.parseInt(xpath));
                } else {
                    node = node.path(xpath);
                }
            }
        }
        return node.asText();
    }

    public Integer getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }
}
