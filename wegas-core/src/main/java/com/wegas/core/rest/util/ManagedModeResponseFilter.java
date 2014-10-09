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
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.exception.ExceptionWrapper;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import javax.naming.NamingException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
////import javax.xml.bind.annotation.XmlRootElement;
//import javax.xml.bind.annotation.XmlType;
import org.apache.http.HttpStatus;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.Collection;
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

        //rmf.commit();
        if (Boolean.parseBoolean(request.getHeaderString("managed-mode"))
                && !(response.getEntity() instanceof ExceptionWrapper)) { // If there was an exception during the request, we forward it without a change
            ServerResponse serverResponse = new ServerResponse();

            if (response.getEntity() instanceof List) {
                serverResponse.setEntities((List) response.getEntity());

            } else if (response.getEntity() instanceof ScriptObjectMirror 
                    && ((ScriptObjectMirror)response.getEntity()).isArray()) {
                serverResponse.setEntities(new ArrayList(((ScriptObjectMirror) response.getEntity()).values()));
            } else if (response.getEntity() != null) {
                ArrayList entities = new ArrayList();
                entities.add(response.getEntity());
                serverResponse.setEntities(entities);
            }
            response.setStatus(HttpStatus.SC_OK);
            response.setEntity(serverResponse);

            if (!rmf.getRequestManager().getUpdatedInstances().isEmpty()) {
                //serverResponse.getEvents().add(new EntityUpdatedEvent(rmf.getUpdatedInstances()));
                EntityUpdatedEvent e = new EntityUpdatedEvent(rmf.getUpdatedInstances());
                serverResponse.getEvents().add(e);
                try {
                    WebsocketFacade websocketFacade = Helper.lookupBy(WebsocketFacade.class, WebsocketFacade.class);
                    websocketFacade.onRequestCommit(e);
                } catch (NamingException ex) {
                    java.util.logging.Logger.getLogger(ManagedModeResponseFilter.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

            serverResponse.getEvents().addAll(rmf.getRequestManager().getClientEvents());// Push events stored in RequestManager
        }
    }

    //@XmlRootElement
    //@XmlType(name = "")
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
    private static class ServerResponse {

        private List<AbstractEntity> entities;
        private List<ClientEvent> events;

        public ServerResponse() {
            this.events = new ArrayList<>();
            this.entities = new ArrayList<>();
}

        /**
         * @return the entities
         */
        public List<AbstractEntity> getEntities() {
            return entities;
        }

        /**
         * @param entities the entities to set
         */
        public void setEntities(List<AbstractEntity> entities) {
            this.entities = entities;
        }

        /**
         * @return the events
         */
        public List<ClientEvent> getEvents() {
            return events;
        }

        /**
         * @param events the events to set
         */
        public void setEvents(List<ClientEvent> events) {
            this.events = events;
        }
    }
}
