/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasWrappedException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.apache.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;

/**
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
        final String managedMode = request.getHeaderString("managed-mode");
        String id = request.getHeaderString("INTERNAL-ID");
        long duration = System.currentTimeMillis()
                - Long.parseLong(request.getHeaderString("INTERNAL-DATE"), 10);

        logger.info("Request [" + id + "] Processed in " + duration
                + " [ms] => " + response.getStatusInfo());
        if (response.getStatusInfo().getStatusCode() >= 400) {
            logger.warn("Problem : " + response.getEntity());
        }

        if (managedMode != null && !managedMode.toLowerCase().equals("false")) {

            ManagedResponse serverResponse = new ManagedResponse();
            List entities;
            boolean rollbacked = false;

            /*
             * if response entity is kind of exception.
             * it means something went wrong during the process -> Rollback any db changes
             *
             * Behaviour is to return a managed response with an empty entity list
             * and to register the exception as a request exception event
             */
            if (response.getEntity() instanceof Exception) {
                // No Entities but register exception as event
                entities = new ArrayList<>();
                WegasRuntimeException wrex;

                if (response.getEntity() instanceof WegasRuntimeException) {
                    wrex = (WegasRuntimeException) response.getEntity();
                } else {
                    wrex = new WegasWrappedException((Exception) response.getEntity());
                }

                rmf.getRequestManager().addException(wrex);

                // Set response http status code to 400
                response.setStatus(HttpStatus.SC_BAD_REQUEST);
                rollbacked = true;
            } else {
                /* 
                 * Request has been processed without throwing a fatal exception lead
                 * to DB modifications 
                 * -> Include all modifed entites in the managed response
                 */

                if (response.getEntity() instanceof List) {
                    entities = new ArrayList<>();
                    for (Object o : (List) response.getEntity()) {
                        entities.add(o);
                    }
                    //entities = (List<Object>) response.getEntity();
                } else if (response.getEntity() instanceof ScriptObjectMirror
                        && ((ScriptObjectMirror) response.getEntity()).isArray()) {
                    entities = new ArrayList(((ScriptObjectMirror) response.getEntity()).values());
                } else if (response.getEntity() != null) {
                    entities = new ArrayList<>();
                    entities.add(response.getEntity());
                } else {
                    entities = new ArrayList<>();
                }

                response.setStatus(HttpStatus.SC_OK);
            }

            List<AbstractEntity> updatedEntities = rmf.getUpdatedEntities();
            Map<String, List<AbstractEntity>> destroyedEntities = rmf.getDestroyedEntities();

            if (!rollbacked && !(updatedEntities.isEmpty() && destroyedEntities.isEmpty())) {

                /*
                 * Merge updatedInstance within ManagedResponse entities
                 */
                for (AbstractEntity ae : updatedEntities) {
                    if (!entities.contains(ae)) {
                        entities.add(ae);
                    }
                }
                /*
                 * EntityUpdatedEvent propagates changes through websocket
                 */
                //serverResponse.getEvents().add(e);
                try {
                    WebsocketFacade websocketFacade = Helper.lookupBy(WebsocketFacade.class, WebsocketFacade.class);
                    if (managedMode.matches("^[\\d\\.]+$")) { //Socket id
                        websocketFacade.onRequestCommit(rmf.getDispatchedEntities(), rmf.getDestroyedEntities(), managedMode);
                    } else {
                        websocketFacade.onRequestCommit(rmf.getDispatchedEntities(), rmf.getDestroyedEntities());
                    }
                } catch (NamingException | NoPlayerException ex) {
                    java.util.logging.Logger.getLogger(ManagedModeResponseFilter.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

            // Push events stored in RequestManager
            serverResponse.getEvents().addAll(rmf.getRequestManager().getClientEvents());

            // Set entities
            serverResponse.setEntities(entities);
            response.setEntity(serverResponse);
        }
    }
}
