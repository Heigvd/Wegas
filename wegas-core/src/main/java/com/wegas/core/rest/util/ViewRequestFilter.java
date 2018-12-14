/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.security.ejb.UserFacade;
import io.prometheus.client.Counter;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import javax.ejb.EJB;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.PreMatching;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.Provider;
import org.glassfish.jersey.jackson.internal.jackson.jaxrs.cfg.EndpointConfigBase;
import org.glassfish.jersey.jackson.internal.jackson.jaxrs.cfg.ObjectWriterInjector;
import org.glassfish.jersey.jackson.internal.jackson.jaxrs.cfg.ObjectWriterModifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This filters takes the first path segment (first line of code) and uses it as
 * the current View in for jackson serialization.
 *
 * @see com.wegas.core.ejb.RequestManager . Available view are
 * "Public"(default), "Export", "Editor", "Extended", "Instance"
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Provider
@PreMatching
public class ViewRequestFilter implements ContainerRequestFilter {

    @EJB
    RequestIdentifierGenerator idGenerator;

    @EJB
    UserFacade userFacade;

    @EJB
    RequestFacade requestFacade;

    private static final Counter requests = Counter.build()
            .name("requests_total").help("Total requests.").register();

    private final static Logger logger = LoggerFactory.getLogger(ViewRequestFilter.class);

    /**
     * Handle view parameter
     *
     * @param cr
     */
    @Override
    public void filter(ContainerRequestContext cr) throws IOException {
        RequestManager requestManager = requestFacade.getRequestManager();

        requestManager.setSocketId(cr.getHeaderString("socketId"));

        requests.inc();
        requestManager.setRequestId(idGenerator.getUniqueIdentifier());
        requestManager.setMethod(cr.getMethod());
        requestManager.setPath(cr.getUriInfo().getPath());

        //String userAgent = cr.getHeaderString("user-agent");
        Class<?> view;

        // Handle language parameter
        if (cr.getHeaderString("lang") != null
                && !cr.getHeaderString("lang").isEmpty()) {
            requestFacade.setLocale(new Locale(cr.getHeaderString("lang")));
        } else if (cr.getHeaderString("Accept-Language") != null && !cr.getHeaderString("Accept-Language").isEmpty()) {
            requestFacade.setLocale(new Locale(cr.getHeaderString("Accept-Language")));
        } else {
            requestFacade.setLocale(Locale.getDefault());
        }

        String newUri = cr.getUriInfo().getRequestUri().toASCIIString();
        String firstPathSeg = cr.getUriInfo().getPathSegments().get(0).getPath();

        switch (firstPathSeg) {
            case "Public":
            case "Extended":
            case "Export":
            case "Editor":
            case "Lobby":
            case "Instance":
                //rmf.setView(this.stringToView(firstPathSeg));
                view = this.stringToView(firstPathSeg);
                newUri = newUri.replace(firstPathSeg + "/", "");
                break;

            default:
                //rmf.setView(Views.Public.class);
                view = Views.Public.class;
                break;
        }

        logger.info("Start Request [{}] {} {}", requestManager.getRequestId(), cr.getMethod(), cr.getUriInfo().getPath());

        try {
            cr.setRequestUri(new URI(newUri));
        } catch (URISyntaxException ex) {
            logger.error(null, ex);
        }

        if (cr.getUriInfo().getQueryParameters().get("view") != null) {
            // If the view is given through a query parameter
            //rmf.setView(this.stringToView(cr.getUriInfo().getQueryParameters().get("view").get(0)));
            view = this.stringToView(cr.getUriInfo().getQueryParameters().get("view").get(0));
        }

        // Propadate new view to ObjectWriter
        ObjectWriterInjector.set(new JsonViewModifier(view));
    }

    /**
     *
     * @param str
     *
     * @return Views.Class matching str or public
     */
    public Class stringToView(String str) {
        switch (str) {
            case "Extended":
                return Views.Extended.class;

            case "Export":
                return Views.Export.class;

            case "Instance":
                return Views.Instance.class;

            case "Lobby":
                return Views.Lobby.class;

            case "Editor":
                return Views.Editor.class;

            case "Public":
            default:
                return Views.Public.class;
        }
    }

    private static class JsonViewModifier extends ObjectWriterModifier {

        Class<?> view;

        public JsonViewModifier(Class<?> view) {
            this.view = view;
        }

        @Override
        public ObjectWriter modify(EndpointConfigBase<?> ecb, MultivaluedMap<String, Object> mm, Object o, ObjectWriter writer, JsonGenerator jg) throws IOException {
            return writer.withView(view);
        }
    }

}
