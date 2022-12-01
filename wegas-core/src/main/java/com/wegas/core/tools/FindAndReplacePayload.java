/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.tools;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class FindAndReplacePayload {

    private String find;
    private String replace;

    private List<String> roots;

    private boolean matchCase = false;
    private boolean regex = true;

    private boolean pretend = true;

    private boolean processVariables = true;
    private boolean processScripts = false;
    private boolean processPages = false;
    private boolean processStyles = false;

    private JsonNode languages;

    private ArrayList<String> langs = new ArrayList<>();

    public String getFind() {
        return find;
    }

    public void setFind(String find) {
        this.find = find;
    }

    public String getReplace() {
        return replace;
    }

    public void setReplace(String replace) {
        this.replace = replace;
    }

    public List<String> getRoots() {
        return roots;
    }

    public void setRoots(List<String> varRoots) {
        this.roots = varRoots;
    }

    public boolean isMatchCase() {
        return matchCase;
    }

    public void setMatchCase(boolean matchCase) {
        this.matchCase = matchCase;
    }

    public boolean isPretend() {
        return pretend;
    }

    public void setPretend(boolean pretend) {
        this.pretend = pretend;
    }

    public boolean isRegex() {
        return regex;
    }

    public void setRegex(boolean regex) {
        this.regex = regex;
    }

    public boolean getProcessVariables() {
        return processVariables;
    }

    public void setProcessVariables(boolean processVariables) {
        this.processVariables = processVariables;
    }

    public boolean getProcessScripts() {
        return processScripts;
    }

    public void setProcessScripts(boolean processScripts) {
        this.processScripts = processScripts;
    }

    public boolean getProcessPages() {
        return processPages;
    }

    public void setProcessPages(boolean processPages) {
        this.processPages = processPages;
    }

    public boolean getProcessStyles() {
        return processStyles;
    }

    public void setProcessStyles(boolean processStyles) {
        this.processStyles = processStyles;
    }

    public JsonNode getLanguages() {
        return languages;
    }

    public void setLangsFromGameModel(GameModel gm) {
        this.langs.clear();
        for (GameModelLanguage lang : gm.getRawLanguages()) {
            this.langs.add(lang.getCode());
        }
    }

    public void setLanguages(JsonNode languages) {
        this.languages = languages;

        if (this.languages != null) {
            this.langs.clear();
            Iterator<Map.Entry<String, JsonNode>> fields = this.languages.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> next = fields.next();
                if (next.getValue().asBoolean()) {
                    this.langs.add(next.getKey());
                }
            }
        }
    }

    public boolean shouldProcessLang(String lang) {
        return this.langs.contains(lang);
    }
}
