/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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

    public static final String INFO = "info";
    public static final String WARN = "warn";
    public static final String ERROR = "error";
    
    
    public WegasErrorMessage(String level, String message){
        super(message);
        this.level = level;
    }

    public static WegasErrorMessage warn(String message){
        return new WegasErrorMessage(WARN, message);
    }
    
    public static WegasErrorMessage error(String message){
        return new WegasErrorMessage(ERROR, message);
    }
    
    public static WegasErrorMessage info(String message){
        return new WegasErrorMessage(INFO, message);
    }

    public String getLevel() {
        return level;
    }
}
