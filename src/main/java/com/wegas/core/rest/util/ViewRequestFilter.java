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
            case "Index":
                rmf.setView(Views.Index.class);
                newUri = newUri.replace("Index/", "");
                break;

            case "Public":
                rmf.setView(Views.Public.class);
                newUri = newUri.replace("Public/", "");
                break;

            case "Private":
                cr.getPathSegments().remove(0);
                String id = cr.getPathSegments().remove(0).getPath();
                rmf.setView(Views.Private.class);
                rmf.setPlayer(new Long(id));
                newUri = newUri.replace("Private/" + id + "/", "");
                break;

            case "Export":
                rmf.setView(Views.Export.class);
                newUri = newUri.replace("Export/", "");
                break;

            case "Editor":
                rmf.setView(Views.Editor.class);
                newUri = newUri.replace("Editor/", "");
                break;
        }
        try {
            cr.setUris(cr.getBaseUri(), new URI(newUri));
        }
        catch (URISyntaxException ex) {
            logger.error(null, ex);
        }

        return cr;
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
