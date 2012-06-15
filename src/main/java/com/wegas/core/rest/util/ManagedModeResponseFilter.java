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

import com.sun.jersey.spi.container.*;
import com.wegas.core.ejb.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.exception.ExceptionWrapper;
import java.util.ArrayList;
import java.util.List;
import javax.naming.NamingException;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ManagedModeResponseFilter implements ContainerResponseFilter, ResourceFilter {

    private final static Logger logger = LoggerFactory.getLogger(ManagedModeResponseFilter.class);

    /**
     * This method encapsulates a Jersey response's entities in a ServerResponse
     * and add server side events.
     *
     *
     * @param request
     * @param response
     * @return
     */
    @Override
    public ContainerResponse filter(ContainerRequest request, ContainerResponse response) {
        if (Boolean.parseBoolean(request.getHeaderValue("Managed-Mode"))//) {
                && !( response.getEntity() instanceof ExceptionWrapper )) { // If there was an exception during the request, we forward it without a change

            ServerResponse serverResponse = new ServerResponse();

            if (response.getEntity() instanceof List) {
                serverResponse.setEntities((List) response.getEntity());

            } else {
                ArrayList entities = new ArrayList();
                entities.add(response.getEntity());
                serverResponse.setEntities(entities);
            }
            response.setEntity(serverResponse);

            try {
                VariableInstanceFacade gameManager = Helper.lookupBy(VariableInstanceFacade.class);
                if (!gameManager.getUpdatedInstances().isEmpty()) {
                    serverResponse.getEvents().add(new EntityUpdatedEvent(gameManager.getUpdatedInstances()));
                }
            }
            catch (NamingException ex) {
                logger.error("Unable to find the game manager.");
            }

        }
        return response;
    }

    /**
     *
     * @return
     */
    @Override
    public ContainerRequestFilter getRequestFilter() {
        return null;
    }

    /**
     *
     * @return
     */
    @Override
    public ContainerResponseFilter getResponseFilter() {
        return this;
    }

    @XmlRootElement
    @XmlType(name = "")
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
    private class ServerResponse {

        /**
         *
         */
       // @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
        private List<AbstractEntity> entities;
        /**
         *
         */
        private List<ServerEvent> events = new ArrayList<>();

        public ServerResponse() {
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
        public List<ServerEvent> getEvents() {
            return events;
        }

        /**
         * @param events the events to set
         */
        public void setEvents(List<ServerEvent> events) {
            this.events = events;
        }
    }

    @XmlRootElement
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
    abstract private static class ServerEvent {

        public ServerEvent() {
        }
    }

    @XmlType(name = "EntityUpdatedEvent")
    private static class EntityUpdatedEvent extends ServerEvent {

        private List<VariableInstance> updatedEntities;

        public EntityUpdatedEvent() {
        }

        public EntityUpdatedEvent(List<VariableInstance> updatedEntities) {
            this.updatedEntities = updatedEntities;
        }

        /**
         * @return the updatedEntities
         */
        public List<VariableInstance> getUpdatedEntities() {
            return updatedEntities;
        }

        /**
         * @param updatedEntities the updatedEntities to set
         */
        public void setUpdatedEntities(List<VariableInstance> updatedEntities) {
            this.updatedEntities = updatedEntities;
        }
    }
}
