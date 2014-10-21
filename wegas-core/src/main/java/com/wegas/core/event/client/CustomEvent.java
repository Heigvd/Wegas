/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
     *
     * @return @throws IOException
     */
    public String toJson() throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.writeValueAsString(this);
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
