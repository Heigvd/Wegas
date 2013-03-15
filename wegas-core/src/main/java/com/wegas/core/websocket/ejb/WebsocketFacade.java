/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.websocket.ejb;

import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.EntityUpdatedEvent;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.websocket.pusher.Pusher;
import java.io.IOException;
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
    public Object send(String channel, String entityType, String entityId, String data) throws IOException {
        Pusher p = new Pusher();
        Pusher.triggerPush(entityType+"-" + entityId, channel, data);
        return null;
    }
    
    public void onRequestCommit(@Observes EntityUpdatedEvent events) throws IOException {
        VariableInstance v;
        EntityUpdatedEvent player = new EntityUpdatedEvent();
        EntityUpdatedEvent team = new EntityUpdatedEvent();
        EntityUpdatedEvent game = new EntityUpdatedEvent();
        Long playerId = null;
        Long teamId = null;
        Long gameId = null;
        
        for (int i=0; i<events.getUpdatedEntities().size(); i++){
            v = events.getUpdatedEntities().get(i);
            if (v.getScope() instanceof GameModelScope){
                //Not supported yet
            } else if (v.getScope() instanceof GameScope){
                game.addEntity(v);
                gameId = variableInstanceFacade.findGame(v).getId();
            } else if (v.getScope() instanceof TeamScope){
                team.addEntity(v);
                teamId = variableInstanceFacade.findTeam(v).getId();
            } else if (events.getUpdatedEntities().get(i).getScope() instanceof PlayerScope){
                player.addEntity(v);
                playerId = variableInstanceFacade.findAPlayer(v).getId();
            }
        }
        if (game.getUpdatedEntities().size() > 0){
            Pusher.triggerPush("Game-" +gameId, "EntityUpdatedEvent", game.toJson());
        }
        if (team.getUpdatedEntities().size() > 0){
            Pusher.triggerPush("Team-" + teamId, "EntityUpdatedEvent", team.toJson());
        }
        if (player.getUpdatedEntities().size() > 0){
            Pusher.triggerPush("Player-" + playerId, "EntityUpdatedEvent", player.toJson());
        }
    }
}
