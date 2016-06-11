/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.exception;

//import javax.xml.bind.annotation.XmlRootElement;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.exception.client.WegasErrorMessage;

/**
 * @deprecated
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
//@XmlRootElement
//@XmlType(name = "RestException")
@JsonTypeName(value = "RestException")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class ExceptionWrapper {

    private String code;
    private Class exception;
    private String message;
    private String level;

    /**
     *
     */
    public ExceptionWrapper() {
    }

    /**
     *
     * Wrap exception with 
     * 
     * @param code
     * @param exception
     * @param message
     */
    public ExceptionWrapper(String code, Class exception, String message) {
        this.code = code;
        this.exception = exception;
        this.message = message;
        this.level = WegasErrorMessage.ERROR;
    }

    /**
     *
     * @param code
     * @param exception
     * @param level
     * @param message
     */
    public ExceptionWrapper(String code, Class exception, String level, String message) {
        this(code, exception, message);
        this.level = level;
    }

    /**
     * @return the code
     */
    public String getCode() {
        return code;
    }

    /**
     * @param code the code to set
     */
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * @return the exception
     */
    public Class getException() {
        return exception;
    }

    /**
     * @param exception the exception to set
     */
    public void setException(Class exception) {
        this.exception = exception;
    }

    /**
     * @return the message
     */
    public String getMessage() {
        return message;
    }

    /**
     * @param message the message to set
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Get exception level
     * @return the level
     */
    public String getLevel() {
        return level;
    }

    /**
     * Set exception level
     * @param level the level to set
     */
    public void setLevel(String level) {
        this.level = level;
    }
}
