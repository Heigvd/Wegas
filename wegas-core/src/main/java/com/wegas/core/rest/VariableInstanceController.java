/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.events.Event;
import com.wegas.core.persistence.variable.events.EventInboxInstance;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class VariableInstanceController {

    /**
     *
     */
    @Inject
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     * @param entityId
     * @param entity
     *
     * @return up to date instance
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public VariableInstance update(@PathParam("entityId") Long entityId, VariableInstance entity) {
        return variableInstanceFacade.update(entityId, entity);
    }

    /**
     *
     * @param gameModelId id of the gameModel
     * @param playerId    player id
     *
     * @return all instances from player's game belonging to the player
     */
    @GET
    @Path("AllPlayerInstances/{playerId:[1-9][0-9]*}")
    public Collection<VariableInstance> getAll(@PathParam("gameModelId") Long gameModelId, @PathParam("playerId") Long playerId) {
        return playerFacade.getInstances(playerId);
    }

    @POST
    @Path("ByIds")
    public Collection<VariableInstance> getByIds(@PathParam("gameModelId") Long gameModelId, List<Long> ids) {
        Collection<VariableInstance> instances = new ArrayList<>();
        for (Long id : ids) {
            instances.add(variableInstanceFacade.find(id));
        }
        return instances;
    }

    /**
     * @param variableInstanceId the event inbox instance id
     * @return all the events contained in this inbox instance
     */
    @GET
    @Path("{variableInstanceId: [1-9][0-9]*}/GetEvents")
    public Collection<Event> getEvents(@PathParam("variableInstanceId") Long variableInstanceId){
        var varInstance = variableInstanceFacade.find(variableInstanceId);
        if(varInstance instanceof EventInboxInstance){
            return ((EventInboxInstance)varInstance).getEvents();
        }
        throw WegasErrorMessage.error(variableInstanceId + " was expected to be of type EventInboxInstance");
    }

    /**
     *
     * @param variableDescriptorId
     *
     * @return all instances from variableDescriptor (but the default ones)
     */
    @GET
    public Collection<VariableInstance> index(@PathParam("variableDescriptorId") Long variableDescriptorId) {
        // @fixme Is this method still in use?

        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);

        List<VariableInstance> instances = new ArrayList<>();

        instances.addAll(
                variableDescriptorFacade.getInstances(vd).values()
        );

        return instances;
    }

    /**
     *
     * @param variableDescriptorId
     * @param playerId
     *
     * @return variable instance from descriptor belonging to the given player
     */
    @GET
    @Path("player/{playerId: [1-9][0-9]*}")
    public VariableInstance find(@PathParam("variableDescriptorId") Long variableDescriptorId, @PathParam("playerId") Long playerId) {
        return variableInstanceFacade.find(variableDescriptorId, playerId);
    }

    /**
     *
     * @param variableDescriptorId
     * @param variableInstanceId
     *
     * @return the instance or null if the instance is not instance of the given
     *         variable descriptor
     */
    @GET
    @Path("{variableInstanceId: [1-9][0-9]*}")
    public VariableInstance get(@PathParam("variableDescriptorId") Long variableDescriptorId, @PathParam("variableInstanceId") Long variableInstanceId) {
        VariableInstance vi = variableInstanceFacade.find(variableInstanceId);
        if (variableDescriptorId != null && !vi.getParentId().equals(variableDescriptorId)) {
            return null;
        }

        return vi;
    }

    /**
     *
     *
     * @param gameModelId
     * @param variableDescriptorId
     * @param userId
     * @param newInstance
     *
     * @return up to date instance
     */
    @POST
    @Path("user/{userId : [1-9][0-9]*}")
    public VariableInstance updateVariableInstance(
            // @fixme Is this method still in use?
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("userId") Long userId,
            VariableInstance newInstance) {
        return variableInstanceFacade.update(variableDescriptorId, userId, newInstance);
    }
}
