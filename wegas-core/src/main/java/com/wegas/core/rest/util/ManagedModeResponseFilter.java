/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.exception.external.WegasRuntimeException;
import com.wegas.core.exception.external.WegasWrappedException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import javax.naming.NamingException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
import org.apache.http.HttpStatus;
import com.wegas.core.exception.internal.NoPlayerException;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Provider
public class ManagedModeResponseFilter implements ContainerResponseFilter {

    private final static Logger logger = LoggerFactory.getLogger(ManagedModeResponseFilter.class);

    /**
     * This method encapsulates a Jersey response's entities in a ServerResponse
     * and add server side events.
     *
     * @param request
     * @param response
     */
    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        RequestFacade rmf = RequestFacade.lookup();

        if (Boolean.parseBoolean(request.getHeaderString("managed-mode"))) {
            
            ManagedResponse serverResponse = new ManagedResponse();

            /*
             * if response entity is kind of exception.
             * it means something went wrong during the process -> Rollback any db changes
             *
             * Behaviour is to return a managed response with an empty entity list
             * and to register the exception as a request exception event
             */
            if (response.getEntity() instanceof Exception) {
                // Empty Entity List
                serverResponse.setEntities(new ArrayList<>());

                // Register exception
                WegasRuntimeException wrex;

                if (response.getEntity() instanceof WegasRuntimeException){
                    wrex = (WegasRuntimeException) response.getEntity();
                } else {
                    wrex = new WegasWrappedException((Exception) response.getEntity());
                }

                rmf.getRequestManager().addException(wrex);

                // Set response http status code to 400
                response.setStatus(HttpStatus.SC_BAD_REQUEST);
            } else {
                /* 
                 * Request has been processed without throwing a fatal exception lead
                 * to DB modifications 
                 * -> Include all modifed entites in the managed response
                 */

                if (response.getEntity() instanceof List) {
                    serverResponse.setEntities((List) response.getEntity());
                } else if (response.getEntity() instanceof ScriptObjectMirror
                        && ((ScriptObjectMirror) response.getEntity()).isArray()) {
                    serverResponse.setEntities(new ArrayList(((ScriptObjectMirror) response.getEntity()).values()));
                } else if (response.getEntity() != null) {
                    ArrayList entities = new ArrayList();
                    entities.add(response.getEntity());
                    serverResponse.setEntities(entities);
                }

                response.setStatus(HttpStatus.SC_OK);
            }

            response.setEntity(serverResponse);

            if (!rmf.getRequestManager().getUpdatedInstances().isEmpty()) {
                //serverResponse.getEvents().add(new EntityUpdatedEvent(rmf.getUpdatedInstances()));
                EntityUpdatedEvent e = new EntityUpdatedEvent(rmf.getUpdatedInstances());
                serverResponse.getEvents().add(e);
                try {
                    WebsocketFacade websocketFacade = Helper.lookupBy(WebsocketFacade.class, WebsocketFacade.class);
                    websocketFacade.onRequestCommit(e);
                } catch (NamingException | NoPlayerException ex) {
                    java.util.logging.Logger.getLogger(ManagedModeResponseFilter.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

            serverResponse.getEvents().addAll(rmf.getRequestManager().getClientEvents());// Push events stored in RequestManager
        }
    }
}
