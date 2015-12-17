/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.util.SecurityHelper;
import com.wegas.messaging.ejb.MessageFacade;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.authz.UnauthorizedException;

/**
 * @deprecated ???
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/")
@Produces(MediaType.APPLICATION_JSON)
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


    @EJB
    private RequestFacade requestFacade;

    /**
     *
     * @param instanceId
     * @return
     */
    @GET
    @Path("{instanceId : [1-9][0-9]*}/Message")
    public List<Message> findAll(@PathParam("instanceId") Long instanceId) {

        InboxInstance inbox = (InboxInstance) variableInstanceFacade.find(instanceId);
        checkPermissions(inbox);

        return inbox.getMessages();
    }

    /**
     *
     * @param messageId
     * @return
     */
    @GET
    @Path("Message/{messageId : [1-9][0-9]*}")
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
    public InboxInstance readMessage(@PathParam("messageId") Long messageId) {

        Message update = messageFacade.find(messageId);
        checkPermissions(update);

        update.setUnread(false);
        if (!Helper.isNullOrEmpty(update.getToken())) {
            requestFacade.commit();
        }
        return update.getInboxInstance();
    }

    /**
     *
     * @param messageId
     * @return
     */
    @DELETE
    @Path("Message/{messageId : [1-9][0-9]*}")
    public InboxInstance deleteMessage(@PathParam("messageId") Long messageId) {

        Message m = messageFacade.find(messageId);
        checkPermissions(m);

        messageFacade.remove(m);
        return m.getInboxInstance();
    }

    /**
     *
     * @param instance
     */
    private void checkPermissions(VariableInstance instance) {
        if (!SecurityHelper.isPermitted(variableInstanceFacade.findGame(instance), "Edit")) {
            try {
                playerFacade.findCurrentPlayer(variableInstanceFacade.findGame(instance)).getId();
                //System.out.println(playerId + " playerid readMessage");

            } catch (Exception e) {
                throw new UnauthorizedException();
            }
        }
    }

    /**
     *
     * @param m
     */
    private void checkPermissions(Message m) {
        checkPermissions(m.getInboxInstance());
    }
}
