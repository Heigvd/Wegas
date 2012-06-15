/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest.util.exception;

import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@XmlRootElement
@XmlType(name = "RestException")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class ExceptionWrapper {

    private String code;
    private Class exception;
    private String message;

    /**
     *
     */
    public ExceptionWrapper() {
    }

    /**
     *
     * @param code
     * @param exception
     * @param message
     */
    public ExceptionWrapper(String code, Class exception, String message) {
        this.code = code;
        this.exception = exception;
        this.message = message;
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
}
