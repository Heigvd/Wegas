/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest.util;

import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import com.wegas.core.ejb.RequestManagerFacade;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This filters takes the first path segment and uses it as the current View in
 * the
 *
 * @see com.wegas.core.ejb.RequestManager . Available view are "Index",
 * "Public", "Private" and "Export".
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ViewRequestFilter implements ContainerRequestFilter, ResourceFilter {

    private final static Logger logger = LoggerFactory.getLogger(ViewRequestFilter.class);

    /**
     *
     *
     * @param cr
     * @return
     */
    @Override
    public ContainerRequest filter(ContainerRequest cr) {
        RequestManagerFacade rmf = RequestManagerFacade.lookup();

        // Handle language parameter
        if (cr.getHeaderValue("lang") != null
                && !cr.getHeaderValue("lang").isEmpty()) {
            rmf.setLocale(new Locale(cr.getHeaderValue("lang")));
        } else if (cr.getHeaderValue("Accept-Language") != null && !cr.getHeaderValue("Accept-Language").isEmpty()) {
            rmf.setLocale(new Locale(cr.getHeaderValue("Accept-Language")));
        } else {
            rmf.setLocale(Locale.getDefault());
        }

        // Handle view parameter
        String newUri = cr.getRequestUri().toString();
        String firstPathSeg = cr.getPathSegments().get(0).getPath();
        switch (firstPathSeg) {
            

            case "Private":
                String id = cr.getPathSegments().get(1).getPath();
                rmf.setView(this.stringToView(firstPathSeg));
                rmf.setPlayer(new Long(id));
                newUri = newUri.replace("Private/" + id + "/", "");
                break;
            case "Index":
            case "Public":
            case "Export":
            case "Editor":
                rmf.setView(this.stringToView(firstPathSeg));
                newUri = newUri.replace(firstPathSeg + "/", "");
                break;
        }

        try {
            cr.setUris(cr.getBaseUri(), new URI(newUri));
        } catch (URISyntaxException ex) {
            logger.error(null, ex);
        }

        if (cr.getQueryParameters().get("view") != null) {                      // If the view is given through a query parameter
            rmf.setView(this.stringToView(cr.getQueryParameters().get("view").get(0)));
        }

        return cr;
    }

    public Class stringToView(String str) {
        switch (str) {
            case "Index":
                return Views.Index.class;

            case "Private":
                return Views.Private.class;

            case "Export":
                return Views.Export.class;

            case "Editor":
                return Views.Editor.class;

            case "Public":
            default:
                return Views.Public.class;
        }

    }

    @Override
    public ContainerRequestFilter getRequestFilter() {
        return this;
    }

    @Override
    public ContainerResponseFilter getResponseFilter() {
        return null;
    }
}
