/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-websocketlistener', function(Y) {
    "use strict";

    var WebSocketListener = Y.Base.create("WebSocketListener", Y.Plugin.Base, [], {


        initializer: function() {
            Pusher.log = Y.log;    // Enable pusher logging - don't include this in production

            document.WEB_SOCKET_DEBUG = true;// Flash fallback logging - don't include this in production

            this.pusher = new Pusher('732a1df75d93d028e4f9');
            this.gameChannel = this.pusher.subscribe('Game-' + Y.Wegas.app.get("currentGame"));
            this.teamChannel = this.pusher.subscribe('Team-' + Y.Wegas.app.get("currentTeam"));
            this.playerChannel = this.pusher.subscribe('Player-' + Y.Wegas.app.get("currentPlayer"));
            
            // event response
            this.gameChannel.bind('EntityUpdatedEvent', Y.bind(this.onVariableInstanceUpdate, this));
            this.teamChannel.bind('EntityUpdatedEvent', Y.bind(this.onVariableInstanceUpdate, this));
            this.playerChannel.bind('EntityUpdatedEvent', Y.bind(this.onVariableInstanceUpdate, this));
          
            this.gameChannel.bind('CustomEvent', Y.bind(this.onCustomEvent, this));
            this.teamChannel.bind('CustomEvent', Y.bind(this.onCustomEvent, this));
            this.playerChannel.bind('CustomEvent', Y.bind(this.onCustomEvent, this)); 
},
        
        /**
         *
         */
        triggerCustomEvent: function (channel, event) {
            var id;
            if (channel == "Game"){
                id = Y.Wegas.app.get("currentGame");
            } else if (channel == "Team"){
                id = Y.Wegas.app.get("currentTeam");
            } else {
                id = Y.Wegas.app.get("currentPlayer");
            }

            this.get("host").sendRequest({
                cfg: { 
                    fullUri: Y.Wegas.app.get("base") + "rest/Pusher/Send/" + channel + "/" + id,
                    method: "POST",
                    data: {
                        "@class": "CustomEvent",
                        event: event
                    }
                }
            });
        },
        
        onVariableInstanceUpdate: function(data){
             // this.get("host").cache.updateCache(data);
             // @fixme send updated event 
        },
        
        onCustomEvent: function(data){
            this.fire(data.event.type, data.event);                   
        }
         
    }, {
        NS: "ws",
        NAME: "WebSocketListener"
    });
    Y.namespace('Plugin').WebSocketListener = WebSocketListener;

});
