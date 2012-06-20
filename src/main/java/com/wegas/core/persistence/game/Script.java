/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.game;

import java.io.Serializable;
import javax.persistence.Embeddable;
import javax.persistence.Lob;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
@Embeddable
@XmlType(name = "")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class Script implements Serializable {

    /**
     *
     */
    private String lang;
    /**
     *
     */
    @Lob
    private String content;

    public Script() {

    }

    public Script(String language, String content) {
        this.lang = language;
        this.content = content;
    }
    /**
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }

    /**
     * @return the language
     */
    public String getLanguage() {
        return this.lang;
    }

    /**
     *
     * @param language
     */
    public void setLanguage(String language) {
        this.lang = language;
    }

    @Override
    public String toString() {
        return "ScriptEntity(" + "language=" + this.lang + ", content=" + this.content + ')';
    }
}
