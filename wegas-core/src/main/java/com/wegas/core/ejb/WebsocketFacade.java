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
import javax.enterprise.event.Observes;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

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

    public WebsocketFacade() {
        Pusher tmp;
        try {
            tmp = new Pusher(Helper.getWegasProperty("pusher.appId"), Helper.getWegasProperty("pusher.key"), Helper.getWegasProperty("pusher.secret"));
        } catch (Exception e) {
            logger.error("Pusher init failed", e);
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
     * @param events
     */
    @Asynchronous
    public void onRequestCommit(@Observes EntityUpdatedEvent events) {
        if (this.pusher == null) {
            return;
        }
        VariableInstance v;
        EntityUpdatedEvent player = new EntityUpdatedEvent();
        EntityUpdatedEvent team = new EntityUpdatedEvent();
        EntityUpdatedEvent game = new EntityUpdatedEvent();
        Long playerId = null;
        Long teamId = null;
        Long gameId = null;
        final GameModel gameModel = events.getUpdatedEntities().get(0).getScope().getVariableDescriptor().getGameModel();

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
                game.addEntity(v);
                gameId = variableInstanceFacade.findGame(v).getId();
            } else if (v.getScope() instanceof TeamScope
                    || v.getScope().getBroadcastScope().equals(TeamScope.class.getSimpleName())) {
                team.addEntity(v);
                teamId = variableInstanceFacade.findTeam(v).getId();
            } else if (events.getUpdatedEntities().get(i).getScope() instanceof PlayerScope
                    || v.getScope().getBroadcastScope().equals(PlayerScope.class.getSimpleName())) {
                player.addEntity(v);
                playerId = variableInstanceFacade.findAPlayer(v).getId();
            }
        }
        if (game.getUpdatedEntities().size() > 0) {
            try {
                pusher.trigger("Game-" + gameId, "EntityUpdatedEvent", game.toJson());
            } catch (IOException ex) {
                //
            }
        }
        if (team.getUpdatedEntities().size() > 0) {
            try {
                pusher.trigger("Team-" + teamId, "EntityUpdatedEvent", team.toJson());
            } catch (IOException ex) {
                //
            }
        }
        if (player.getUpdatedEntities().size() > 0) {
            try {
                pusher.trigger("Player-" + playerId, "EntityUpdatedEvent", player.toJson());
            } catch (IOException ex) {
            }
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
