/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.util.SecurityHelper;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}/VariableInstance/")
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
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public VariableInstance update(@PathParam("entityId") Long entityId, VariableInstance entity) {
        /* Check permission, either:
         * 1) current user can edit the game
         * 2) entity to update effectively belongs to the current player
         */
        VariableInstance target = variableInstanceFacade.find(entityId);

        if (SecurityHelper.isPermitted(variableInstanceFacade.findGame(entityId), "Edit") || target == target.getDescriptor().getInstance()) {
            return variableInstanceFacade.update(entityId, entity);
        } else {
            throw new UnauthorizedException();
        }
    }

    /**
     *
     * @param variableDescriptorId
     * @fixme Is this method still in use?
     *
     * @return
     */
    @GET
    public Collection<VariableInstance> index(@PathParam("variableDescriptorId") Long variableDescriptorId) {

        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + vd.getGameModelId());

        return vd.getScope().getVariableInstances().values();
    }

    /**
     *
     * @param variableDescriptorId
     * @param variableInstanceId
     *
     * @return
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
     * @fixme Is this method still in use?
     *
     * @param gameModelId
     * @param variableDescriptorId
     * @param userId
     * @param newInstance
     * @return
     */
    @POST
    @Path("user/{userId : [1-9][0-9]*}")
    public VariableInstance setVariableInstance(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("variableDescriptorId") Long variableDescriptorId,
            @PathParam("userId") Long userId,
            VariableInstance newInstance) {
        return variableInstanceFacade.update(variableDescriptorId, userId, newInstance);
    }
}
