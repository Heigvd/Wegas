/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

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
