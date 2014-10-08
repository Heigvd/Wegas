/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.Provider;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxece Laurent <maxence.laurent at gmail.com>
 */
@Provider
@Produces({MediaType.APPLICATION_JSON})
public class JacksonMapperProvider /*implements ContextResolver<ObjectMapper> */{

    private final static org.slf4j.Logger logger = LoggerFactory.getLogger(JacksonMapperProvider.class);
    /**
     *
     */
    //ObjectMapper mapper;

    /**
     *
     * @param aClass
     * @return
     */
    //@Override
    public ObjectMapper getContext(Class<?> aClass) {
        return JacksonMapperProvider.getMapper();
    }

    /**
     *
     * @return
     */
    public static ObjectMapper getMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        /*AnnotationIntrospector primary = new JacksonAnnotationIntrospector();   // Create a new annotation inspector that combines jaxb and jackson
        AnnotationIntrospector secondary = new JaxbAnnotationIntrospector(mapper.getTypeFactory());
        AnnotationIntrospector pair = AnnotationIntrospector.pair(primary, secondary);

        mapper.setAnnotationIntrospector(pair);*/

        return mapper;
    }
}
