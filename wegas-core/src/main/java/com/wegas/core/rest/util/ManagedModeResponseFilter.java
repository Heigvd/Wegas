/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasWrappedException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.ejb.UserFacade;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.apache.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Provider
//@Stateless
public class ManagedModeResponseFilter implements ContainerResponseFilter {

    private final static Logger logger = LoggerFactory.getLogger(ManagedModeResponseFilter.class);
    /**
     *
     */
    @EJB
    private WebsocketFacade websocketFacade;
    /**
     *
     */
    @EJB
    private RequestFacade rmf;

    @EJB
    private UserFacade userFacade;

    /**
     * This method encapsulates a Jersey response's entities in a ServerResponse
     * and add server side events.
     *
     * @param request
     * @param response
     */
    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        final String managedMode = request.getHeaderString("managed-mode");

        // Todo find a way to access responce from RequestManager.preDestroy (@Context HttpServletResponse?)
        rmf.getRequestManager().setStatus(response.getStatusInfo());

        if (response.getStatusInfo().getStatusCode() >= 400) {
            logger.warn("Problem : " + response.getEntity());
        }

        if (managedMode != null && !managedMode.toLowerCase().equals("false")) {

            ManagedResponse serverResponse = new ManagedResponse();
            List updatedEntities;
            List deletedEntities = new ArrayList<>();

            boolean rollbacked = false;

            /*
             * if response entity is kind of exception.
             * it means something went wrong during the process -> Rollback any db changes
             *
             * Behaviour is to return a managed response with an empty entity list
             * and to register the exception as a request exception event
             */
            if (response.getEntity() instanceof Exception || rmf.getRequestManager().getExceptionCounter() > 0) {

                // No Entities but register exception as event
                updatedEntities = new ArrayList<>();
                WegasRuntimeException wrex;

                if (response.getEntity() instanceof WegasRuntimeException) {
                    wrex = (WegasRuntimeException) response.getEntity();
                } else if (response.getEntity() instanceof Exception) {
                    wrex = new WegasWrappedException((Exception) response.getEntity());
                } else {
                    wrex = WegasErrorMessage.error("Something went wrong");
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

                List entities;

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

                updatedEntities = entities;

                response.setStatus(HttpStatus.SC_OK);
            }

            Map<String, List<AbstractEntity>> updatedEntitiesMap = rmf.getUpdatedEntities();
            Map<String, List<AbstractEntity>> destroyedEntitiesMap = rmf.getDestroyedEntities();
            Map<String, List<AbstractEntity>> outdatedEntitiesMap = rmf.getOutdatedEntities();

            if (!rollbacked && !(updatedEntitiesMap.isEmpty() && destroyedEntitiesMap.isEmpty() && outdatedEntitiesMap.isEmpty())) {
                /*
                 * Merge updatedInstance within ManagedResponse entities
                 */
                for (Entry<String, List<AbstractEntity>> entry : updatedEntitiesMap.entrySet()) {
                    String audience = entry.getKey();
                    if (userFacade.hasPermission(audience)) {
                        for (AbstractEntity ae : entry.getValue()) {
                            if (!updatedEntities.contains(ae)) {
                                updatedEntities.add(ae);
                            }
                        }
                    }
                }
                /*
                 * Merge updatedInstance within ManagedResponse entities
                 */
                for (Entry<String, List<AbstractEntity>> entry : destroyedEntitiesMap.entrySet()) {
                    String audience = entry.getKey();
                    if (userFacade.hasPermission(audience)) {
                        for (AbstractEntity ae : entry.getValue()) {
                            if (!deletedEntities.contains(ae)) {
                                deletedEntities.add(ae);
                            }
                            /*
                             * Since each entity which has been returned by the rest method is included
                             * within updatedEntities list by default, make sure to not include thoses which
                             * where destroyed
                             */
                            if (updatedEntities.contains(ae)) {
                                updatedEntities.remove(ae);
                            }
                        }
                    }
                }

                websocketFacade.onRequestCommit(updatedEntitiesMap, destroyedEntitiesMap, outdatedEntitiesMap,
                        (managedMode.matches("^[\\d\\.]+$") ? managedMode : null));
            }

            // Push events stored in RequestManager
            serverResponse.getEvents().addAll(rmf.getRequestManager().getClientEvents());

            // Set entities
            serverResponse.setUpdatedEntities(updatedEntities);
            serverResponse.setDeletedEntities(deletedEntities);

            response.setEntity(serverResponse);
        }
    }
}
