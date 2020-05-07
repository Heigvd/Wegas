/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.databind.AnnotationIntrospector;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationContentDeserializer;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;

/**
 *
 * @author Maxece Laurent <maxence.laurent at gmail.com>
 */
@Provider
@Produces({MediaType.APPLICATION_JSON})
public class JacksonMapperProvider implements ContextResolver<ObjectMapper> {

    /**
     *
     */
    //ObjectMapper mapper;

    /**
     * {@inheritDoc}
     */
    @Override
    public ObjectMapper getContext(Class<?> aClass) {
        return JacksonMapperProvider.getMapper();
    }

    /**
     *
     * @return an ObjectMapper
     */
    public static ObjectMapper getMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        /*AnnotationIntrospector primary = new JacksonAnnotationIntrospector();   // Create a new annotation inspector that combines jaxb and jackson
        AnnotationIntrospector secondary = new JaxbAnnotationIntrospector(mapper.getTypeFactory());
        AnnotationIntrospector pair = AnnotationIntrospector.pair(primary, secondary);

        mapper.setAnnotationIntrospector(pair);*/

        SimpleModule customSerialisers =new SimpleModule();
        customSerialisers.addDeserializer(TranslatableContent.class, new TranslationContentDeserializer());

        mapper.registerModule(customSerialisers);

        AnnotationIntrospector jackson = new JacksonAnnotationIntrospector();
        mapper.setAnnotationIntrospector(jackson);
        mapper.disable(MapperFeature.USE_GETTERS_AS_SETTERS);
        return mapper;
    }
}
