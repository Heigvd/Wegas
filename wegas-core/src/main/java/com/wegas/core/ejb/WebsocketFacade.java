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
import com.wegas.core.Helper;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.Asynchronous;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import java.io.IOException;
import java.util.AbstractMap;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.MissingResourceException;

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    private static final Logger logger = LoggerFactory.getLogger(WebsocketFacade.class);

    private final Pusher pusher;

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
     * @param events Event to send
     */
    @Asynchronous
    public void onRequestCommit(final EntityUpdatedEvent events) throws NoPlayerException {
        this.onRequestCommit(events, null);
    }

    /**
     * fire and forget pusher events
     *
     * @param events   Event to send
     * @param socketId Client's socket id. Prevent that specific client to
     *                 receive this particular message
     */
    @Asynchronous
    public void onRequestCommit(final EntityUpdatedEvent events, final String socketId) throws NoPlayerException {
        if (this.pusher == null) {
            return;
        }
        VariableInstance v;

        final Map<Long, EntityUpdatedEvent> games = new HashMap<>();
        final Map<Long, EntityUpdatedEvent> teams = new HashMap<>();
        final Map<Long, EntityUpdatedEvent> players = new HashMap<>();

//        if (!gameModel.getProperties().getWebsocket().equals("")) {
//            return;
//        }
        for (int i = 0; i < events.getUpdatedEntities().size(); i++) {
            v = events.getUpdatedEntities().get(i);
            if (v.getScope() instanceof GameModelScope /*
                     * ||
                     * v.getScope().getBroadcastScope().equals(GameModelScope.class.getSimpleName())
                     */) {
                //Not supported yet
            } else if (v.getScope() instanceof GameScope
                    || v.getScope().getBroadcastScope().equals(GameScope.class.getSimpleName())) {
                putInstance(games, variableInstanceFacade.findGame(v).getId(), v);
            } else if (v.getScope() instanceof TeamScope
                    || v.getScope().getBroadcastScope().equals(TeamScope.class.getSimpleName())) {
                putInstance(teams, variableInstanceFacade.findTeam(v).getId(), v);
            } else if (v.getScope() instanceof PlayerScope
                    || v.getScope().getBroadcastScope().equals(PlayerScope.class.getSimpleName())) {
                putInstance(players, variableInstanceFacade.findAPlayer(v).getId(), v);
            }
        }

        propagate(games, "Game-", socketId);
        propagate(teams, "Team-", socketId);
        propagate(players, "Player-", socketId);
    }

    private void propagate(Map<Long, EntityUpdatedEvent> map, String prefix, final String socketId) {
        for (Entry<Long, EntityUpdatedEvent> entry : map.entrySet()) {
            try {
                pusher.trigger(prefix + entry.getKey(), "EntityUpdatedEvent", entry.getValue().toJson(), socketId);
            } catch (IOException ex) {
                //
            }
        }
    }

    private void putInstance(Map<Long, EntityUpdatedEvent> map, Long id, VariableInstance v) {
        EntityUpdatedEvent tmp;
        if (map.containsKey(id)) {
            tmp = map.get(id);
        } else {
            tmp = new EntityUpdatedEvent();
            map.put(id, tmp);
        }
        tmp.addEntity(v);
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
