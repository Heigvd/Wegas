/*
 * Wegas.
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
import com.wegas.core.ejb.Helper;
import com.wegas.core.ejb.RequestManagerFacade;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.logging.Level;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * This filters takes the first path segment and uses it as the current View in
 * the com.wegas.core.ejb.RequestManager .
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ViewRequestFilter implements ContainerRequestFilter, ResourceFilter {

    private final static Logger logger = LoggerFactory.getLogger(ViewRequestFilter.class);

    @Override
    public ContainerRequest filter(ContainerRequest cr) {
        String firstPathSeg = cr.getPathSegments().get(0).getPath();
        if (firstPathSeg.equals("Editor")) {
            this.setView(cr, Views.Editor.class);
        } else if (firstPathSeg.equals("Export")) {
            this.setView(cr, Views.Export.class);
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

    private void setView(ContainerRequest cr, Class view) {
        try {
            cr.setUris(cr.getBaseUri(),
                    new URI(cr.getRequestUri().toString().replace(view.getSimpleName() + "/", "")));
            Helper.lookupBy(RequestManagerFacade.class).setView(view);
        }
        catch (URISyntaxException ex) {
            logger.error("Error creating uri", ex);
        }
        catch (NamingException ex) {
            logger.error("Error retrieving requestManagerFacade", ex);
        }
    }
}
