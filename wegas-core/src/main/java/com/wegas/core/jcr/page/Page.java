/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.page;

import java.io.IOException;
import java.io.Serializable;
import java.util.LinkedList;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import name.fraser.neil.plaintext.StandardBreakScorer;
import name.fraser.neil.plaintext.diff_match_patch;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.ObjectMapper;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
public class Page implements Serializable {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Page.class);
    @JsonIgnore
    @XmlTransient
    private static ObjectMapper mapper = new ObjectMapper();
    private Integer id;
    private JsonNode content;
    private String name;

    /**
     *
     * @param id
     * @param content
     * @throws IOException
     */
    public Page(Integer id, String content) throws IOException {
        this.id = id;
        this.content = mapper.readTree(content);
    }

    /**
     *
     * @param id
     * @param content
     */
    public Page(Integer id, JsonNode content) {
        this.id = id;
        this.content = content;
    }

    /**
     *
     */
    public Page() {
    }

    /**
     *
     * @return
     */
    public Integer getId() {
        return id;
    }

    /**
     *
     * @param id
     */
    public void setId(Integer id) {
        this.id = id;
    }

    /**
     *
     * @return
     */
    public JsonNode getContent() {
        return content;
    }

    /**
     *
     * @param content
     */
    @JsonIgnore
    public void setContent(JsonNode content) {
        this.content = content;
    }

    /**
     *
     * @param content
     * @throws IOException
     */
    @JsonIgnore
    public void setContent(String content) throws IOException {
        this.content = mapper.readTree(content);
    }

    /**
     *
     * @return
     */
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @param patch
     * @throws IOException
     */
    public void patch(String patch) throws IOException {
        diff_match_patch dmp = new diff_match_patch(new StandardBreakScorer());
        LinkedList<diff_match_patch.Patch> patches = (LinkedList<diff_match_patch.Patch>) dmp.patch_fromText(patch);
        Object[] result = dmp.patch_apply(patches, this.content.toString());
        logger.info("INPUT\n" + this.content.toString() + "\nPATCH\n" + patch + "\nRESULT\n" + (String) result[0]);
        this.setContent((String) result[0]);
    }
}
