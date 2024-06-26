/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasWrappedException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelContent;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.Provider;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Provider
@RequestScoped // payara 3994 workaround (fixed in 193)
public class ManagedModeResponseFilter implements ContainerResponseFilter {

    private final static Logger logger = LoggerFactory.getLogger(ManagedModeResponseFilter.class);
    /**
     *
     */
    @Inject
    private WebsocketFacade websocketFacade;
    /**
     *
     */
    @Inject
    private RequestFacade requestFacade;

    /**
     * This method encapsulates a Jersey response's entities in a ServerResponse and add server side
     * events.
     *
     * @param request
     * @param response
     */
    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        final String managedMode = request.getHeaderString("managed-mode");

        // Todo find a way to access response from RequestManager.preDestroy (@Context HttpServletResponse?)  WHY ?
        RequestManager requestManager = requestFacade.getRequestManager();

        // make sure to release all tokens
        requestManager.releaseTokens();

        requestManager.markManagermentStartTime();
        requestManager.setStatus(response.getStatusInfo());

        if (response.getStatusInfo().getStatusCode() >= 400) {
            List<Exception> exceptions = new ArrayList<>();
            requestManager.getClientEvents().forEach(event -> {
                if (event instanceof ExceptionEvent) {
                    exceptions.addAll(((ExceptionEvent) event).getExceptions());
                }
            });

            if (response.getEntity() == null && !exceptions.isEmpty()) {
                response.setEntity(exceptions.remove(0));
            }
            if (response.getEntity() != null) {
                logger.warn("Problem : {}", response.getEntity());

                if (response.getEntity() instanceof WegasRuntimeException) {
                    WegasRuntimeException wre = (WegasRuntimeException) response.getEntity();
                    response.setStatus(wre.getHttpStatus().getStatusCode());
                }
            }

            exceptions.forEach(ex
                -> logger.warn("Problem :", ex)
            );
        }

        boolean rollbacked = false;

        Map<String, List<AbstractEntity>> updatedEntitiesMap = requestManager.getAllMappedUpdatedEntities();
        Map<String, List<AbstractEntity>> destroyedEntitiesMap = requestManager.getMappedDestroyedEntities();

        boolean isManaged = managedMode != null && !managedMode.toLowerCase().equals("false");

        if (isManaged) {
            ManagedResponse serverResponse = new ManagedResponse();
            /*
             * returnd entities are not to propagate through websockets unless they're registered
             * within requestManager's updatedEntities
             */
            List<Object> updatedEntities;
            List<AbstractEntity> deletedEntities = new LinkedList<>();


            /*
             * if response entity is kind of exception. it means something went wrong during the
             * process -> Rollback any db changes
             *
             * Behaviour is to return a managed response with an empty entity list and to register
             * the exception as a request exception event
             */
            if (response.getEntity() instanceof Exception || requestManager.getExceptionCounter() > 0 || response.getStatusInfo().getStatusCode() >= 400) {

                // No Entities but register exception as event
                updatedEntities = new LinkedList<>();
                WegasRuntimeException wrex;

                if (response.getEntity() instanceof WegasRuntimeException) {
                    wrex = (WegasRuntimeException) response.getEntity();
                    requestManager.addException(wrex);
                } else if (response.getEntity() instanceof Exception) {
                    wrex = new WegasWrappedException((Exception) response.getEntity());
                    requestManager.addException(wrex);
                } else if (requestManager.getExceptionCounter() == 0) {
                    wrex = WegasErrorMessage.error("Something went wrong");
                    requestManager.addException(wrex);
                }

                // Set response http status code to 400
                if (response.getStatusInfo().getStatusCode() < 400) {
                    response.setStatus(Status.BAD_REQUEST.getStatusCode());
                    requestManager.setStatus(response.getStatusInfo());
                }
                rollbacked = true;
            } else {
                /*
                 * Request has been processed without throwing a fatal exception -> Include all
                 * returned entities (modified or not) in the managed response
                 */

                List entities;

                if (response.getEntity() instanceof Collection) {
                    entities = new LinkedList<>();
                    for (Object o : (Collection) response.getEntity()) {
                        entities.add(o);
                    }
                    //entities = (List<Object>) response.getEntity();
                } else if (response.getEntity() instanceof ScriptObjectMirror
                    && ((ScriptObjectMirror) response.getEntity()).isArray()) {
                    entities = new LinkedList(((ScriptObjectMirror) response.getEntity()).values());
                } else if (response.getEntity() != null) {
                    entities = new LinkedList<>();
                    entities.add(response.getEntity());
                } else {
                    entities = new LinkedList<>();
                }

                updatedEntities = entities;

                response.setStatus(Status.OK.getStatusCode());
            }

            if (!rollbacked && !(updatedEntitiesMap.isEmpty() && destroyedEntitiesMap.isEmpty())) {
                /**
                 * Include all detected updated entities within updatedEntites (the ones which will
                 * be returned to the client)
                 */
                for (Entry<String, List<AbstractEntity>> entry : updatedEntitiesMap.entrySet()) {
                    String audience = entry.getKey();
                    if (requestManager.hasChannelPermission(audience)) {
                        for (AbstractEntity ae : entry.getValue()) {
                            if (!updatedEntities.contains(ae)) {
                                updatedEntities.add(ae);
                            }
                        }
                    }
                }
                /*
                 * Let's do the same but for destroyed entities
                 */
                for (Entry<String, List<AbstractEntity>> entry : destroyedEntitiesMap.entrySet()) {
                    String audience = entry.getKey();
                    if (requestManager.hasChannelPermission(audience)) {
                        for (AbstractEntity ae : entry.getValue()) {
                            if (!deletedEntities.contains(ae)) {
                                deletedEntities.add(ae);
                            }
                            /*
                             * Since each entity which has been returned by the rest method is
                             * included within updatedEntities list by default, make sure to not
                             * include thoses which where destroyed
                             */
                            if (updatedEntities.contains(ae)) {
                                updatedEntities.remove(ae);
                            }
                        }
                    }
                }
            }

            // Push events stored in RequestManager
            serverResponse.getEvents().addAll(requestManager.getClientEvents());

            // Set entities
            serverResponse.setUpdatedEntities(updatedEntities);
            serverResponse.setDeletedEntities(deletedEntities);

            response.setEntity(serverResponse);

            // Be sure it is json, a void method won't add this.
            response.getHeaders().putSingle(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON);

        } else {
            if (response.getEntity() instanceof Exception || requestManager.getExceptionCounter() > 0 || response.getStatusInfo().getStatusCode() >= 400) {
                rollbacked = true;
                Object entity = response.getEntity();
                if (entity instanceof Exception) {
                    try {
                        response.setEntity(JacksonMapperProvider.getMapper().writeValueAsString(entity));
                    } catch (JsonProcessingException ex) {
                        logger.error("Failed to serialize exception {}", entity);
                    }
                }
            }
        }

        String socketId = requestManager.getSocketId();

        String eSocketId = (!isManaged || Helper.isNullOrEmpty(socketId) || !socketId.matches("^[\\d\\.]+$"))
            ? null : socketId;

        if (!rollbacked) {
            if (!(updatedEntitiesMap.isEmpty() && destroyedEntitiesMap.isEmpty())) {
                requestManager.markPropagationStartTime();
                websocketFacade.onRequestCommit(updatedEntitiesMap, destroyedEntitiesMap,
                    eSocketId);
                requestManager.markPropagationEndTime();
            }

            requestManager.getAllUpdatedEntities().stream()
                .filter(entity -> entity instanceof GameModelContent)
                .forEach(gameModelContent
                    -> websocketFacade.gameModelContentUpdate((GameModelContent)gameModelContent, eSocketId)
                );

            requestManager.getDestroyedEntities().stream()
                .filter(entity -> entity instanceof GameModelContent)
                .forEach(gameModelContent
                    -> websocketFacade.gameModelContentDestroy((GameModelContent)gameModelContent, eSocketId)
                );
        }

        //requestFacade.flushClear();
        requestManager.markSerialisationStartTime();
    }
}
