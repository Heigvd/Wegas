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
package com.wegas.exception;

import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@XmlRootElement
@JsonIgnoreProperties({"cause", "stackTrace", "suppressed"})
@XmlType(name = "WegasScriptException")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class WegasScriptException extends WegasException {

    private String script;
    private Integer lineNumber;

    public WegasScriptException() {
    }

    public WegasScriptException(String message) {
        super(message);
    }

    public WegasScriptException(String script, Integer lineNumber) {
        this.script = script;
        this.lineNumber = lineNumber;
    }

    public WegasScriptException(String script, Integer lineNumber, String message) {
        super(message);
        this.script = script;
        this.lineNumber = lineNumber;
    }

    public WegasScriptException(String script, Integer lineNumber, String message, Throwable cause) {
        super(message, cause);
        this.script = script;
        this.lineNumber = lineNumber;
    }

    public WegasScriptException(String message, Throwable cause) {
        super(message, cause);
    }

    public WegasScriptException(String script, String message) {
        super(message);
        this.script = script;
    }

    public WegasScriptException(String script, String message, Throwable cause) {
        super(message, cause);
        this.script = script;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public Integer getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(Integer lineNumber) {
        this.lineNumber = lineNumber;
    }
}
