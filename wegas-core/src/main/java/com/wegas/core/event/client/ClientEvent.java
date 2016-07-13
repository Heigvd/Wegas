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
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import java.io.IOException;
import java.io.Serializable;

/**
 *
 * @author Yannick Lagger (lagger.yannick at gmail.com)
 */
//@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = CustomEvent.class),
    @JsonSubTypes.Type(value = EntityUpdatedEvent.class),
    @JsonSubTypes.Type(value = EntityDestroyedEvent.class),
    @JsonSubTypes.Type(value = OutdatedEntitiesEvent.class),
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
        ObjectWriter writerWithView = mapper.writerWithView(Views.Editor.class);
        return writerWithView.writeValueAsString(this);
    }
}
