/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception;

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
public class ScriptException extends WegasException {

    private String script;
    private Integer lineNumber;

    /**
     *
     */
    public ScriptException() {
    }

    /**
     *
     * @param message
     */
    public ScriptException(String message) {
        super(message);
    }

    /**
     *
     * @param script
     * @param lineNumber
     */
    public ScriptException(String script, Integer lineNumber) {
        this.script = script;
        this.lineNumber = lineNumber;
    }

    /**
     *
     * @param script
     * @param lineNumber
     * @param message
     */
    public ScriptException(String script, Integer lineNumber, String message) {
        super(message);
        this.script = script;
        this.lineNumber = lineNumber;
    }

    /**
     *
     * @param script
     * @param lineNumber
     * @param message
     * @param cause
     */
    public ScriptException(String script, Integer lineNumber, String message, Throwable cause) {
        super(message, cause);
        this.script = script;
        this.lineNumber = lineNumber;
    }

    /**
     *
     * @param message
     * @param cause
     */
    public ScriptException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     *
     * @param script
     * @param message
     */
    public ScriptException(String script, String message) {
        super(message);
        this.script = script;
    }

    /**
     *
     * @param script
     * @param message
     * @param cause
     */
    public ScriptException(String script, String message, Throwable cause) {
        super(message, cause);
        this.script = script;
    }

    /**
     *
     * @return
     */
    public String getScript() {
        return script;
    }

    /**
     *
     * @param script
     */
    public void setScript(String script) {
        this.script = script;
    }

    /**
     *
     * @return
     */
    public Integer getLineNumber() {
        return lineNumber;
    }

    /**
     *
     * @param lineNumber
     */
    public void setLineNumber(Integer lineNumber) {
        this.lineNumber = lineNumber;
    }
}
