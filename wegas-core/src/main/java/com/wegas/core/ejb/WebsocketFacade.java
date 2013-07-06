/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.EntityUpdatedEvent;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.websocket.pusher.Pusher;
import java.io.IOException;
import javax.ejb.Asynchronous;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    public String send(String filter, String entityType, String entityId, String data) throws IOException {
        Pusher p = new Pusher();
        return Pusher.triggerPush(entityType + "-" + entityId, filter, data);
    }

    /**
     * fire and forget pusher events
     *
     * @param events
     */
    @Asynchronous
    public void onRequestCommit(@Observes EntityUpdatedEvent events) {
        VariableInstance v;
        EntityUpdatedEvent player = new EntityUpdatedEvent();
        EntityUpdatedEvent team = new EntityUpdatedEvent();
        EntityUpdatedEvent game = new EntityUpdatedEvent();
        Long playerId = null;
        Long teamId = null;
        Long gameId = null;

        boolean webSocketAllowed = events.getUpdatedEntities().get(0).getScope().getVariableDescriptor().getGameModel().hasProperty("websocket");
        if (webSocketAllowed) {
            return;
        }

        for (int i = 0; i < events.getUpdatedEntities().size(); i++) {
            v = events.getUpdatedEntities().get(i);
            if (v.getScope() instanceof GameModelScope /*||
                     v.getScope().getBroadcastScope().equals(GameModelScope.class.getSimpleName())*/) {
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
                Pusher.triggerPush("Game-" + gameId, "EntityUpdatedEvent", game.toJson());
            } catch (IOException ex) {
                //
            }
        }
        if (team.getUpdatedEntities().size() > 0) {
            try {
                Pusher.triggerPush("Team-" + teamId, "EntityUpdatedEvent", team.toJson());
            } catch (IOException ex) {
                //
            }
        }
        if (player.getUpdatedEntities().size() > 0) {
            //try {
            //Pusher.triggerPush("Player-" + playerId, "EntityUpdatedEvent", player.toJson());
            //} catch (IOException ex) {
            //
            //}
        }
    }
}
