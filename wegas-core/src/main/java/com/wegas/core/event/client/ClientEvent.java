/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import java.io.Serializable;

/**
 *
 * @author Yannick Lagger (lagger.yannick at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = CustomEvent.class),
    @JsonSubTypes.Type(value = EntityUpdatedEvent.class),
    @JsonSubTypes.Type(value = EntityDestroyedEvent.class),
    @JsonSubTypes.Type(value = OutdatedEntitiesEvent.class),
    @JsonSubTypes.Type(value = ExceptionEvent.class)
})
abstract public class ClientEvent implements Serializable {

    private static final long serialVersionUID = -3358736311025273367L;

    /**
     *
     * @param view view to serialize with
     * @return @throws IOException
     */
    public final String toJson(Class<?> view) throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        //ObjectWriter writerWithView = mapper.writerWithView(Views.Editor.class);
        ObjectWriter writerWithView = mapper.writerWithView(view);
        return writerWithView.writeValueAsString(this);
    }
}
