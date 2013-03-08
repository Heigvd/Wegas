/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.websocket.rest;

import com.wegas.core.websocket.pusher.Pusher;
import java.io.IOException;
import javax.ejb.Stateless;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@Path("Pusher")
public class WebsocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(WebsocketController.class);
    
    /**
     * Retrieve
     *
     * @return
     */
    @POST
    @Path("Send/{entityType : .*}/{entityId : .*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object index(@PathParam("entityType") String entityType, @PathParam("entityId") String entityId, String data) throws IOException {
        Pusher p = new Pusher();
        Pusher.triggerPush(entityType+"-" + entityId, "wegas-event", data);
        return null;
    }
}
