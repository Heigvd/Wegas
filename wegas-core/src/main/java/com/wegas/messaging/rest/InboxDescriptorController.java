/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.messaging.ejb.MessageFacade;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
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
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/")
public class InboxDescriptorController {

    /**
     *
     */
    @EJB
    private MessageFacade messageFacade;
    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;

    /**
     *
     * @param messageId
     * @return
     */
    @GET
    @Path("Message/{messageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Message find(@PathParam("messageId") Long messageId) {

        Message m = messageFacade.find(messageId);
        checkPermissions(m);

        return m;
    }

    /**
     *
     * @param messageId
     * @param message
     * @return
     */
    @PUT
    @Path("Message/{messageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public InboxInstance editMessage(@PathParam("messageId") Long messageId,
            Message message) {
        Message update = messageFacade.update(messageId, message);

        checkPermissions(update);

        return update.getInboxInstance();
    }

    /**
     *
     * @param messageId
     * @return
     */
    @PUT
    @Path("Message/Read/{messageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public InboxInstance readMessage(@PathParam("messageId") Long messageId) {
        Message update = messageFacade.find(messageId);

        checkPermissions(update);

        update.setUnread(false);
        return update.getInboxInstance();
    }

    /**
     *
     * @param messageId
     * @return
     */
    @DELETE
    @Path("Message/{messageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public InboxInstance deleteMessage(@PathParam("messageId") Long messageId) {
        Message m = messageFacade.find(messageId);

        checkPermissions(m);

        messageFacade.remove(m);
        return m.getInboxInstance();
    }

    private void checkPermissions(Message m) {
        if (!SecurityUtils.getSubject().isPermitted("Game:Edit:g" + variableInstanceFacade.findGame(m.getInboxInstance()).getId())) {
            try {
                Long playerId = playerFacade.findCurrentPlayer(variableInstanceFacade.findGame(m.getInboxInstance())).getId();
                //System.out.println(playerId + " playerid readMessage");

            } catch (Exception e) {
                throw new UnauthorizedException();
            }
        }
    }
}
