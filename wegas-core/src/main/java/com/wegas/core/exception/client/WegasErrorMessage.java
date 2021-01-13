/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasErrorMessage extends WegasRuntimeException {

    private static final long serialVersionUID = 5424978937540148253L;

    private final String level;

    // Optional code for client-side localization:
    private final String messageId;

    public static final String INFO = "info";
    public static final String WARN = "warn";
    public static final String ERROR = "error";


    public WegasErrorMessage(String level, String message, String messageId){
        super(message);
        this.level = level;
        this.messageId = messageId;
    }

    public WegasErrorMessage(String level, String message){
        this(level, message, null);
    }

    public static WegasErrorMessage warn(String message){
        return new WegasErrorMessage(WARN, message);
    }

    public static WegasErrorMessage warn(String message, String messageId){
        return new WegasErrorMessage(WARN, message, messageId);
    }

    public static WegasErrorMessage error(String message){
        return new WegasErrorMessage(ERROR, message);
    }

    public static WegasErrorMessage error(String message, String messageId){
        return new WegasErrorMessage(ERROR, message, messageId);
    }

    public static WegasErrorMessage info(String message){
        return new WegasErrorMessage(INFO, message);
    }

    public static WegasErrorMessage info(String message, String messageId){
        return new WegasErrorMessage(INFO, message, messageId);
    }

    public String getLevel() {
        return level;
    }

    public String getMessageId() { return messageId; }
}
