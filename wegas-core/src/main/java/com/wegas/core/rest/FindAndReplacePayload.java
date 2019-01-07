/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class FindAndReplacePayload {

    private String find;
    private String replace;

    private boolean matchCase = false;
    private boolean regex = true;

    private boolean pretend = true;

    private boolean processVariables = true;
    private boolean processScripts = false;
    private boolean processPages = false;
    private boolean processStyles = false;

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
}