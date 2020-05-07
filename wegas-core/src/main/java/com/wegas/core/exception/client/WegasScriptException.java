/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class WegasScriptException extends WegasRuntimeException {

    private String script;
    private Integer lineNumber;

    /**
     *
     */
    public WegasScriptException() {
        // ensure there is a default constructor
    }

    /**
     *
     * @param message
     */
    public WegasScriptException(String message) {
        super(message);
    }

    /**
     *
     * @param script
     * @param lineNumber
     */
    public WegasScriptException(String script, Integer lineNumber) {
        this.script = script;
        this.lineNumber = lineNumber;
    }

    /**
     *
     * @param script
     * @param lineNumber
     * @param message
     */
    public WegasScriptException(String script, Integer lineNumber, String message) {
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
    public WegasScriptException(String script, Integer lineNumber, String message, Throwable cause) {
        super(message, cause);
        this.script = script;
        this.lineNumber = lineNumber;
    }

    /**
     *
     * @param message
     * @param cause
     */
    public WegasScriptException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     *
     * @param script
     * @param message
     */
    public WegasScriptException(String script, String message) {
        super(message);
        this.script = script;
    }

    /**
     *
     * @param script
     * @param message
     * @param cause
     */
    public WegasScriptException(String script, String message, Throwable cause) {
        super(message, cause);
        this.script = script;
    }

    /**
     *
     * @return script content
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
     * @return line number in error
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
