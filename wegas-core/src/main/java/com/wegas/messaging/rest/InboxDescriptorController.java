/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.messaging.ejb.MessageFacade;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import java.util.List;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Inbox/")
@Produces(MediaType.APPLICATION_JSON)
public class InboxDescriptorController {

    /**
     *
     */
    @Inject
    private MessageFacade messageFacade;
    /**
     *
     */
    @Inject
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private RequestFacade requestFacade;

    /**
     * Get all message from the given inbox instance
     *
     * @param instanceId inbox instance identifier
     *
     * @return given inbox all messages
     */
    @GET
    @Path("{instanceId : [1-9][0-9]*}/Message")
    public List<Message> findAll(@PathParam("instanceId") Long instanceId) {

        InboxInstance inbox = (InboxInstance) variableInstanceFacade.find(instanceId);

        return inbox.getMessages();
    }

    /**
     * Get a message
     *
     * @param messageId message id
     *
     * @return the message
     */
    @GET
    @Path("Message/{messageId : [1-9][0-9]*}")
    public Message find(@PathParam("messageId") Long messageId) {

        Message m = messageFacade.find(messageId);

        return m;
    }

    /**
     * Edit a message
     *
     * @param messageId if of message to edit
     * @param message   new message version
     *
     * @return the new message version
     */
    @PUT
    @Path("Message/{messageId : [1-9][0-9]*}")
    public InboxInstance editMessage(@PathParam("messageId") Long messageId,
            Message message) {

        Message update = messageFacade.update(messageId, message);

        return update.getInboxInstance();
    }

    /**
     * Mark message as read
     *
     * @param messageId id of message to mark as read
     * @param playerId
     *
     * @return inbox instance which contains the read message
     */
    @PUT
    @Path("Message/Read/{messageId : [1-9][0-9]*}/{playerId : [1-9][0-9]*}")
    public InboxInstance readMessage(@PathParam("messageId") Long messageId,
            @PathParam("playerId") Long playerId) {

        Message update = messageFacade.find(messageId);

        update.setUnread(false);
        if (!Helper.isNullOrEmpty(update.getToken())) {
            requestFacade.commit(playerId);
        }
        return update.getInboxInstance();
    }

    /**
     * Mark all messages as read
     *
     * @param id       id of inbox instance to read messages from
     * @param playerId
     *
     * @return inbox instance which contains read messages
     */
    @PUT
    @Path("{inboxInstanceId : [1-9][0-9]*}/ReadAll/{playerId : [1-9][0-9]*}")
    public InboxInstance readAllMessages(@PathParam("inboxInstanceId") Long id,
            @PathParam("playerId") Long playerId) {

        InboxInstance inbox = (InboxInstance) variableInstanceFacade.find(id);
        boolean commit = false;

        for (Message message : inbox.getMessages()) {
            message.setUnread(false);
            commit = commit || !Helper.isNullOrEmpty(message.getToken());
        }
        if (commit) {
            requestFacade.commit(playerId);
        }
        return inbox;
    }

    /**
     * Delete a message
     *
     * @param messageId id of message to delete
     *
     * @return InboxInstance which does not contains the message anymore
     */
    @DELETE
    @Path("Message/{messageId : [1-9][0-9]*}")
    public InboxInstance deleteMessage(@PathParam("messageId") Long messageId) {

        Message m = messageFacade.find(messageId);

        messageFacade.remove(m);
        return m.getInboxInstance();
    }
}
