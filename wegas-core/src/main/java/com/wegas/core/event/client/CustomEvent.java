/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
//@JsonTypeName(value = "CustomEvent")
public class CustomEvent extends ClientEvent {

    private static final long serialVersionUID = 1L;
    private String type;
    private Object payload;

    /**
     *
     */
    public CustomEvent() {
        // ensure there is an empty constructor
    }

    /**
     *
     * @param type
     * @param payload
     */
    public CustomEvent(String type, Object payload) {
        this.type = type;
        this.payload = payload;
    }

    /**
     * @return the type
     */
    public String getType() {
        return type;
    }

    /**
     * @param type the type to set
     */
    public void setType(String type) {
        this.type = type;
    }

    /**
     * @return the payload
     */
    public Object getPayload() {
        return payload;
    }

    /**
     * @param payload the payload to set
     */
    public void setPayload(Object payload) {
        this.payload = payload;
    }
}
