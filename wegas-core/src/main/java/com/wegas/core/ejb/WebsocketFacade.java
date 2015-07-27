/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.pusher.rest.Pusher;
import com.pusher.rest.data.PresenceUser;
import com.pusher.rest.data.Result;
import com.wegas.core.Helper;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.ByteArrayOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.Asynchronous;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.MissingResourceException;
import java.util.logging.Level;
import java.util.zip.GZIPOutputStream;

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    private static final Logger logger = LoggerFactory.getLogger(WebsocketFacade.class);

    private final Pusher pusher;
    private final static String GLOBAL_CHANNEL = "presence-global";

    public enum WegasStatus {

        DOWN,
        READY,
        OUTDATED
    };

    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     * @param status
     * @param socketId
     */
    public void sendLifeCycleEvent(WegasStatus status, final String socketId) {
        if (this.pusher != null) {
            pusher.trigger(GLOBAL_CHANNEL, "LifeCycleEvent",
                    "{\"@class\": \"LifeCycleEvent\", \"status\": \"" + status.toString() + "\"}", socketId);
        }
    }

    public void sendPopup(String channel, String message, final String socketId) {
        if (this.pusher != null) {
            pusher.trigger(channel, "CustomEvent",
                    "{\"@class\": \"CustomEvent\", \"type\": \"popupEvent\", \"payload\": {\"content\": \"<p>" + message + "</p>\"}}", socketId);
        }
    }

    private String getProperty(String property) {
        try {
            return Helper.getWegasProperty(property);
        } catch (MissingResourceException ex) {
            logger.warn("Pusher init failed: missing " + property + " property");
            return null;
        }
    }

    public WebsocketFacade() {
        Pusher tmp;
        try {
            tmp = new Pusher(getProperty("pusher.appId"),
                    getProperty("pusher.key"), getProperty("pusher.secret"));
        } catch (Exception e) {
            logger.error("Pusher init failed, please check your configuration");
            logger.debug("Pusher error details", e);
            tmp = null;
        }
        pusher = tmp;
    }

    /**
     * @param filter
     * @param entityType
     * @param entityId
     * @param data
     * @return Status
     * @throws IOException
     */
    public Integer send(String filter, String entityType, String entityId, Object data) throws IOException {
        if (this.pusher == null) {
            return 400;
        }
        return pusher.trigger(entityType + "-" + entityId, filter, data).getHttpStatus();
    }

    /**
     * fire and forget pusher events
     *
     */
    @Asynchronous
    public void onRequestCommit(final Map<String, List<AbstractEntity>> updatedEntities) throws NoPlayerException {
        this.onRequestCommit(updatedEntities, null);
    }

    /**
     * fire and forget pusher events
     *
     * @param updatedEntities entity to propagate mapped by audiance
     * @param socketId        Client's socket id. Prevent that specific client
     *                        to receive this particular message
     * @throws com.wegas.core.exception.internal.NoPlayerException
     */
    @Asynchronous
    public void onRequestCommit(final Map<String, List<AbstractEntity>> updatedEntities, final String socketId) throws NoPlayerException {
        if (this.pusher == null) {
            return;
        }
        VariableInstance v;

        for (String audiance : updatedEntities.keySet()) {
            List<AbstractEntity> toPropagate = updatedEntities.get(audiance);
            propagate(toPropagate, audiance, socketId);
        }
    }

    private String gzip(String data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        GZIPOutputStream gzos = new GZIPOutputStream(baos);
        OutputStreamWriter osw = new OutputStreamWriter(gzos, "UTF-8");

        osw.append(data);
        osw.flush();
        osw.close();

        byte[] ba = baos.toByteArray();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ba.length; i++) {
            // @hack convert to uint array
            /* 
             * Sending a byte[] through pusher result takes lot of place cause 
             * json is like "data: [31, 8, -127, ...]", full text
             */
            sb.append(Character.toString((char) Byte.toUnsignedInt(ba[i])));
        }
        return sb.toString();
    }

    private void propagate(List<AbstractEntity> entities, String audiance, final String socketId) {
        try {
            logger.error("EntityUpdatedEvent.entites: " + audiance + ": " + entities.size());

            EntityUpdatedEvent event = new EntityUpdatedEvent(entities);

            String gzippedJson = gzip(event.toJson());

            Result result = pusher.trigger(audiance, "EntityUpdatedEvent.gz", gzippedJson, socketId);

            logger.error("PUSHER RESULT" + result.getMessage() + " : " + result.getStatus() + " : " + result.getHttpStatus());
            if (result.getHttpStatus() == 403) {
                // Pusher Message Quota Reached...
            } else if (result.getHttpStatus() == 413) {
                // wooops pusher error (too big ?)
                this.sendLifeCycleEvent(WegasStatus.OUTDATED, socketId);
            }
        } catch (IOException ex) {
            logger.error("     IOEX <----------------------", ex);
        }

    }

    public String pusherAuth(final String socketId, final String channel) {
        if (channel.startsWith("presence")) {
            final Map<String, String> userInfo = new HashMap<>();
            User user = userFacade.getCurrentUser();
            userInfo.put("name", user.getName());
            return pusher.authenticate(socketId, channel, new PresenceUser(user.getId(), userInfo));
        }
        if (channel.startsWith("private")) {
            return pusher.authenticate(socketId, channel);
        }
        return null;
    }
}
