/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import java.io.Serializable;
//import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author Yannick Lagger <lagger.yannick at gmail.com>
 */
//@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = CustomEvent.class),
    @JsonSubTypes.Type(value = EntityUpdatedEvent.class),
    @JsonSubTypes.Type(value = ExceptionEvent.class),
    @JsonSubTypes.Type(value = WarningEvent.class)
})
abstract public class ClientEvent implements Serializable {

    /**
     *
     * @return @throws IOException
     */
    public final String toJson() throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.writeValueAsString(this);
    }
}
