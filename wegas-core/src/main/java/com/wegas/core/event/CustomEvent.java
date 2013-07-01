/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event;

import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.map.ObjectMapper;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@XmlType(name = "CustomEvent")
public class CustomEvent extends ServerEvent {

    private String type;
    private Object payload;

    public CustomEvent() {
    }

    public CustomEvent(String type, Object payload) {
        this.type = type;
        this.payload = payload;
    }

    /**
     *
     * @return @throws IOException
     * @throws IOException
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
