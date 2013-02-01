/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.rest;

import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.mcq.ejb.ReplyFacade;
import com.wegas.mcq.persistence.Reply;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;

/**
 *
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/{descriptorId :(([1-9][0-9]*)/)?}Reply/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ReplyController {

    /**
     *
     */
    @EJB
    private ReplyFacade replyFacade;

    /**
     *
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Reply update(@PathParam("entityId") Long entityId, Reply entity) {

        //SecurityUtils.getSubject().checkPermission("Game:Edit:g" + VariableInstanceFacade.findGame(entityId).getId());

        return replyFacade.update(entityId, entity);
    }
}
