/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.rest;

import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.security.ejb.UserFacade;
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
    private UserFacade userFacade;
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

        return update.getInboxInstanceEntity();
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
        return update.getInboxInstanceEntity();
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
        return m.getInboxInstanceEntity();
    }

    private void checkPermissions(Message m){
        if (!SecurityUtils.getSubject().isPermitted("Game:Edit:g" + variableInstanceFacade.findGame(m.getInboxInstanceEntity()).getId())) {
             try{
                Long playerId = playerFacade.findCurrentPlayer(variableInstanceFacade.findGame(m.getInboxInstanceEntity())).getId();
                System.out.println(playerId + " playerid readMessage");
            } catch(Exception e){
                throw new UnauthorizedException();
            }
        }
    }
}
