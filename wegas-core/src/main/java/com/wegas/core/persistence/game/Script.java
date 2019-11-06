/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.persistence.Mergeable;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.View.SelectView.ScriptLanguageSelector;
import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.Lob;
import javax.persistence.Transient;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Embeddable
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class Script implements Serializable, Mergeable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            searchable = true, view = @View(label = "Script Content"))
    private String content = "";
    /**
     *
     */
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(label = "Language", value = ScriptLanguageSelector.class)
    )
    @Column(name = "lang")
    private String language = "JavaScript";

    @Transient
    @JsonIgnore
    private Mergeable parent;

    @Transient
    @JsonIgnore
    private String refId;

    /**
     *
     */
    public Script() {
    }

    /**
     *
     * @param content
     */
    public Script(String content) {
        this.content = content;
    }

    /**
     *
     * @param language
     * @param content
     */
    public Script(String language, String content) {
        this.language = language;
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
        return this.language;
    }

    /**
     *
     * @param language
     */
    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public Mergeable getMergeableParent() {
        return parent;
    }

    public void setParent(Mergeable parent, String refId) {
        this.parent = parent;
        if (parent != null) {
            this.setRefId(parent.getRefId() + refId);
        } else {
            this.setRefId(refId);
        }
    }

    @Override
    public String getRefId() {
        return refId;
    }

    @Override
    public void setRefId(String refId) {
        this.refId = refId;
    }

    @Override
    public String toString() {
        return "ScriptEntity(" + "language:" + this.language + ", content:{\n" + this.content + "\n})";
    }
}
