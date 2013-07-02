/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.ejb.RequestFacade;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;
import org.codehaus.jackson.map.AnnotationIntrospector;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.introspect.JacksonAnnotationIntrospector;
import org.codehaus.jackson.xc.JaxbAnnotationIntrospector;
import org.slf4j.LoggerFactory;

/**
 *
 * @author fx
 */
@Provider
@Produces({MediaType.APPLICATION_JSON})
public class JacksonMapperProvider implements ContextResolver<ObjectMapper> {

    private final static org.slf4j.Logger logger = LoggerFactory.getLogger(JacksonMapperProvider.class);
    /**
     *
     */
    ObjectMapper mapper;

    /**
     *
     */
    public JacksonMapperProvider() {
        this.mapper = JacksonMapperProvider.getMapper();
    }

    /**
     *
     * @param aClass
     * @return
     */
    @Override
    public ObjectMapper getContext(Class<?> aClass) {
        Class view = RequestFacade.lookup().getView();

        mapper.getSerializationConfig().setSerializationView(view);             // Set up which view to use
        //mapper.getSerializationConfig().withView(Views.Editor.class);         // This kind of declaration does not work with glassfish jersey 1.11
        //mapper.writerWithView(Views.Editor.class);
//        mapper.

        return mapper;
    }

    /**
     *
     * @return
     */
    public static ObjectMapper getMapper() {

        ObjectMapper mapper = new ObjectMapper();

        AnnotationIntrospector primary = new JacksonAnnotationIntrospector();   // Create a new annotation inspector that comines jaxb and jackson
        AnnotationIntrospector secondary = new JaxbAnnotationIntrospector();
        AnnotationIntrospector pair = new AnnotationIntrospector.Pair(secondary, primary);

        mapper.setAnnotationIntrospector(pair);
        //mapper.getDeserializationConfig().withAnnotationIntrospector(pair);
        //mapper.getSerializationConfig().withAnnotationIntrospector(pair);


        //mapper.configure(Feature.INDENT_OUTPUT, true);
        //mapper.getSerializationConfig().setDateFormat(myDateFormat);
        //mapper.configure(DeserializationConfig.Feature.USE_ANNOTATIONS, true);
        //mapper.configure(SerializationConfig.Feature.USE_ANNOTATIONS, true);
        //MapperConfigurator mapperConfigurator = new MapperConfigurator(null,new Annotations[]{Annotations.JAXB});

        return mapper;
    }
}
