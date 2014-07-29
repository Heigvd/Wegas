/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import javax.ws.rs.core.Feature;
import javax.ws.rs.core.FeatureContext;
import javax.ws.rs.ext.MessageBodyReader;
import javax.ws.rs.ext.MessageBodyWriter;
import org.codehaus.jackson.jaxrs.JacksonJsonProvider;
import org.codehaus.jackson.jaxrs.JsonMappingExceptionMapper;
import org.codehaus.jackson.jaxrs.JsonParseExceptionMapper;
import org.glassfish.jersey.CommonProperties;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class JacksonFeature implements Feature {

    @Override
    public boolean configure(final FeatureContext context) {

        String postfix = '.' + context.getConfiguration().getRuntimeType().name().toLowerCase();

        context.property(CommonProperties.MOXY_JSON_FEATURE_DISABLE + postfix, true);

        context.register(JsonParseExceptionMapper.class);
        context.register(JsonMappingExceptionMapper.class);
        context.register(JacksonJsonProvider.class, MessageBodyReader.class, MessageBodyWriter.class);

        return true;
    }
}
