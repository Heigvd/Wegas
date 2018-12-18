/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.PusherChannelExistenceWebhook;
import com.wegas.core.rest.util.PusherWebhooks;
import com.wegas.core.security.util.OnlineUser;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import javax.inject.Inject;
import javax.ejb.Stateless;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Yannick Lagger (lagger.yannick.com)
 */
@Stateless
@Path("Pusher/")
public class WebsocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebsocketController.class);
    /**
     * Keep Websocket auth info
     */
    private static final Object WebsocketInfo = new Object() {
        public final String key = Helper.getWegasProperty("pusher.key");
        public final String cluster = Helper.getWegasProperty("pusher.cluster");
    };
    /**
     *
     */
    @Inject
    private WebsocketFacade websocketFacade;

    @GET
    @Path("ApplicationKey")
    @Produces(MediaType.APPLICATION_JSON)
    public Object getApplicationKey() {
        return WebsocketInfo;
    }

    @GET
    @Path("Channels")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<String> getChannels(List<AbstractEntity> entities) {
        return websocketFacade.getChannels(entities);
    }

    /**
     *
     * @param channelName
     * @param socketId
     *
     * @return authentication result to return to client
     */
    @POST
    @Path("auth")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public String pusherAuth(@FormParam("socket_id") String socketId, @FormParam("channel_name") String channelName) {
        return websocketFacade.pusherAuth(socketId, channelName);
    }

    /**
     * Retrieve
     *
     * @param entityType
     * @param data
     * @param eventType
     * @param entityId
     *
     * @return result of websocketFacade send
     *
     * @throws java.io.IOException
     */
    @POST
    @Path("Send/{entityType : .*}/{entityId : .*}/{eventType : .*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response send(@PathParam("entityType") String entityType, @PathParam("entityId") String entityId, @PathParam("eventType") String eventType, Object data) throws IOException {
        return Response.status(websocketFacade.send(eventType, entityType, entityId, data)).build();
    }

    /*
    @GET
    @Path("SendMessage")
    public Response sendMessage() throws IOException {
        websocketFacade.sendPopup(websocketFacade.GLOBAL_CHANNEL, "Hello, World!", null);
        return Response.ok().build();
    }
     */
    /**
     * @param request
     * @param rawHooks
     */
    @POST
    @Path("OnlineUser")
    public void pusherChannelExistenceWebhook(@Context HttpServletRequest request, String rawHooks) throws IOException {
        websocketFacade.authenticateHookSource(request, rawHooks.getBytes());

        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        PusherWebhooks hooks = mapper.readValue(rawHooks, PusherWebhooks.class);

        for (PusherChannelExistenceWebhook hook : hooks.getEvents()) {
            websocketFacade.pusherChannelExistenceWebhook(hook);
        }
    }

    /**
     * Retrieve the list of online users
     *
     * @return the list of current online users
     */
    @GET
    @Path("OnlineUser")
    @RequiresRoles("Administrator")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<OnlineUser> getOnlineUsers() {

        return websocketFacade.getOnlineUsers();
    }

    /**
     * Retrieve the list of online users
     *
     * @return the list of current online users
     */
    @GET
    @Path("OnlineUser/Sync")
    @RequiresRoles("Administrator")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<OnlineUser> syncAndgetOnlineUsers() {
        websocketFacade.syncOnlineUsers();
        return websocketFacade.getOnlineUsers();
    }

    /**
     * Clear internal list of online users. THe list will be rebuild next time
     * Pusher/OnlineUser GET or POST is called
     */
    @DELETE
    @Path("OnlineUser")
    @RequiresRoles("Administrator")
    public void clearOnlineUsers() {
        websocketFacade.clearOnlineUsers();
    }

    @POST
    @Path("RequestClientReload")
    @RequiresRoles("Administrator")
    public void requestClientReload() {
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.OUTDATED, null);
    }

}
