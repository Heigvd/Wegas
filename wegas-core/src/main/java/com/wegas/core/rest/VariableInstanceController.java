/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.util.SecurityHelper;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

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
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     * @param entityId
     * @param entity
     * @return up to date instance
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public VariableInstance update(@PathParam("entityId") Long entityId, VariableInstance entity) {
        /* Check permission, either:
         * 1) current user can edit the game
         * 2) entity to update effectively belongs to the current player
         */
        VariableInstance target = variableInstanceFacade.find(entityId);

        if (SecurityHelper.isPermitted(variableInstanceFacade.findGame(entityId), "Edit") /*|| target == target.getDescriptor().getInstance() */) {
            return variableInstanceFacade.update(entityId, entity);
        } else {
            throw new UnauthorizedException();
        }
    }

    /**
     *
     * @param gameModelId id of the gameModel
     * @param playerId    player id
     * @return all instances from player's game belonging to the player
     */
    @GET
    @Path("AllPlayerInstances/{playerId:[1-9][0-9]*}")
    public Collection<VariableInstance> getAll(@PathParam("gameModelId") Long gameModelId, @PathParam("playerId") Long playerId) {
        SecurityHelper.checkPermission(playerFacade.find(playerId).getGame(), "View");
        return playerFacade.getInstances(playerId);
    }

    @POST
    @Path("ByIds")
    public Collection<VariableInstance> getByIds(@PathParam("gameModelId") Long gameModelId, List<Long> ids) {
        Collection<VariableInstance> instances = new ArrayList<>();
        for (Long id : ids) {
            VariableInstance instance = variableInstanceFacade.find(id);

            if (userFacade.hasPermission(instance.getAudience())) {
                instances.add(instance);
            }
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

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + vd.getGameModelId());

        List<VariableInstance> instances = new ArrayList<>();

        instances.addAll(
                vd.getScope().getVariableInstances().values()
        );

        return instances;
    }

    /**
     *
     * @param variableDescriptorId
     * @param playerId
     * @return variable instance from descriptor belonging to the given player
     */
    @GET
    @Path("player/{playerId: [1-9][0-9]*}")
    public VariableInstance find(@PathParam("variableDescriptorId") Long variableDescriptorId, @PathParam("playerId") Long playerId) {

        VariableInstance vi = variableInstanceFacade.find(variableDescriptorId, playerId);
        if (SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + vi.findDescriptor().getGameModelId()) // Can edit the game model
                || SecurityUtils.getSubject().isPermitted("Game:Edit:g" + variableInstanceFacade.findGame(vi)) // or can edit the game
                || userFacade.matchCurrentUser(playerId)) { // current user is the player
            return vi;
        } else {
            throw new WegasErrorMessage("error", "Forbidden");
        }
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
        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + vi.getDescriptor().getGameModelId());
        if (variableDescriptorId != null && !vi.getDescriptorId().equals(variableDescriptorId)) {
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
     * @return up to date instance
     */
    @POST
    @Path("user/{userId : [1-9][0-9]*}")
    public VariableInstance setVariableInstance(
            // @fixme Is this method still in use?
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("userId") Long userId,
            VariableInstance newInstance) {
        return variableInstanceFacade.update(variableDescriptorId, userId, newInstance);
    }
}
