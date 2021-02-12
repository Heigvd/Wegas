/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core;

import org.slf4j.Logger;

public class IndentLogger {

    private static final String SEP = "    ";

    private int indentLevel = 0;
    private final Logger logger;

    public IndentLogger(Logger logger) {
        this.logger = logger;
    }

    public void info(String msg, Object... args) {
        logger.info(this.buildMessage(msg), args);
    }

    public void error(String msg, Object... args) {
        logger.error(this.buildMessage(msg), args);
    }

    public void debug(String msg, Object... args) {
        logger.debug(this.buildMessage(msg), args);
    }

    public void warn(String msg, Object... args) {
        logger.warn(this.buildMessage(msg), args);
    }

    public void trace(String msg, Object... args) {
        logger.trace(this.buildMessage(msg), args);
    }

    private String buildMessage(String msg) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < indentLevel; i++) {
            sb.append(SEP);
        }
        sb.append(msg);
        return sb.toString();
    }

    public void indent() {
        indentLevel++;
    }

    public void unindent() {
        indentLevel--;
    }
}