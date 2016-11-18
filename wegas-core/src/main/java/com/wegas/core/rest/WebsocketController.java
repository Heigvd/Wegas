/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.persistence.AbstractEntity;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
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
    private static final Object WebsocketInfo = new Object(){
        public final String key = Helper.getWegasProperty("pusher.key");
        public final String cluster = Helper.getWegasProperty("pusher.cluster");
    };
    /**
     *
     */
    @EJB
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
}
