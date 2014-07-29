/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.ejb.RequestFacade;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.PreMatching;
import javax.ws.rs.ext.Provider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This filters takes the first path segment (first line of code) and uses it as
 * the current View in for jackson serialization.
 *
 * @see com.wegas.core.ejb.RequestManager . Available view are "Index",
 * "Public", "Private" and "Export", "Editor" and "PrivatEditor"
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/* ResourceFilter -> DynamicFeature */
//public class ViewRequestFilter implements ContainerRequestFilter, ResourceFilter {
@Provider
@PreMatching
public class ViewRequestFilter implements ContainerRequestFilter {

    private final static Logger logger = LoggerFactory.getLogger(ViewRequestFilter.class);

    /**
     * Handle view parameter
     *
     * @param cr
     * @return
     */
    @Override
    public void filter(ContainerRequestContext cr) throws IOException {
        RequestFacade rmf = RequestFacade.lookup();
        logger.error("VIEW FILTER");
        
        // Handle language parameter
        if (cr.getHeaderString("lang") != null
                && !cr.getHeaderString("lang").isEmpty()) {
            rmf.setLocale(new Locale(cr.getHeaderString("lang")));
        } else if (cr.getHeaderString("Accept-Language") != null && !cr.getHeaderString("Accept-Language").isEmpty()) {
            rmf.setLocale(new Locale(cr.getHeaderString("Accept-Language")));
        } else {
            rmf.setLocale(Locale.getDefault());
        }

        String newUri = cr.getUriInfo().getRequestUri().toASCIIString();
        String firstPathSeg = cr.getUriInfo().getPathSegments().get(0).getPath();

        switch (firstPathSeg) {
            case "Private":
            case "EditorPrivate":
                String id = cr.getUriInfo().getPathSegments().get(1).getPath();
                rmf.setView(this.stringToView(firstPathSeg));
                rmf.setPlayer(Long.valueOf(id));
                newUri = newUri.replace(firstPathSeg + "/" + id + "/", "");
                break;

            case "Index":
            case "Public":
            case "Extended":
            case "Export":
            case "Editor":
            case "EditorExtended":
                rmf.setView(this.stringToView(firstPathSeg));
                newUri = newUri.replace(firstPathSeg + "/", "");
                break;

            default:
                rmf.setView(Views.Public.class);
                break;
        }

        logger.error("final  URI: " + newUri);

        try {
            cr.setRequestUri(new URI(newUri));
        } catch (URISyntaxException ex) {
            logger.error(null, ex);
        }

        if (cr.getUriInfo().getQueryParameters().get("view") != null) {
            // If the view is given through a query parameter
            rmf.setView(this.stringToView(cr.getUriInfo().getQueryParameters().get("view").get(0)));
        }
    }

    /**
     *
     * @param str
     * @return
     */
    public Class stringToView(String str) {
        switch (str) {
            case "Index":
                return Views.Index.class;

            case "Extended":
                return Views.Extended.class;

            case "Private":
                return Views.Private.class;

            case "Export":
                return Views.Export.class;

            case "Editor":
                return Views.Editor.class;

            case "EditorPrivate":
                return Views.EditorPrivate.class;

            case "EditorExtended":
                return Views.EditorExtended.class;

            case "Public":
            default:
                return Views.Public.class;
        }
    }
}
