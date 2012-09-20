/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.jcr.page;

import java.io.Serializable;
import javax.xml.bind.annotation.XmlRootElement;
import org.codehaus.jackson.annotate.JsonCreator;
import org.codehaus.jackson.annotate.JsonProperty;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
public class Page implements Serializable {
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(Page.class);

    private Integer id;
    private JSONObject content;

    public Page(Integer id, String content) throws JSONException {
        this.id = id;
        this.content = new JSONObject(content);
    }

    public Page(Integer id, JSONObject content) {
        this.id = id;
        this.content = content;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public JSONObject getContent() {
        return content;
    }

    public void setContent(JSONObject content) {
        this.content = content;
    }

    public void setContent(String content) throws JSONException {
        this.content = new JSONObject(content);
    }
    @JsonCreator
    public static Page getPage(@JsonProperty("id") Integer id, @JsonProperty("content") JSONObject content) throws JSONException{
        logger.debug(content.toString());
        return new Page(id, content);
    }
}
