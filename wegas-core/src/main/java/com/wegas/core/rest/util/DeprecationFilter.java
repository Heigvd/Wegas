/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import java.io.IOException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class DeprecationFilter implements ContainerRequestFilter {

    /**
     *
     * @param request
     */
    @Override
    public void filter(ContainerRequestContext request) throws IOException {
        RequestFacade rmf = RequestFacade.lookup(); //CDI not available here

        Logger logger = LoggerFactory.getLogger(DeprecationFilter.class);
        String msg = "The requested endpoint (" + request.getMethod() + " /" + request.getUriInfo().getPath() + ") has been deprecated and will be removed in the future";
        String json = "{\"timeout\":2500,\"iconCss\":\"fa fa-warning\",\"content\":\"" + msg + "\"}";
        rmf.getRequestManager().sendNotification(JacksonMapperProvider.getMapper().readValue(json, Object.class));
        rmf.getRequestManager().addException(WegasErrorMessage.warn(msg));
        logger.warn(msg);
    }
}
