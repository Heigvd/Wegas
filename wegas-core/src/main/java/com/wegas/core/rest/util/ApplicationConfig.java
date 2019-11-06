/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import javax.ws.rs.ApplicationPath;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@ApplicationPath("rest")
public class ApplicationConfig extends ResourceConfig {

    public ApplicationConfig() {

        register(JacksonFeature.class);
        register(MultiPartFeature.class);

        // register REST controllers from those packages :
        packages("com.wegas.core.rest",
            "com.wegas.core.security.rest",
            "com.wegas.core.i18n.rest",
            "com.wegas.mcq.rest",
            "com.wegas.messaging.rest",
            "com.wegas.proggame.rest",
            "com.wegas.resourceManagement.rest",
            "com.wegas.reviewing.rest",
            "com.wegas.admin",
            "com.wegas.log.rest");
    }
}
