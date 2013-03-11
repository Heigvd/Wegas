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
            return;
            Pusher.log = Y.log;    // Enable pusher logging - don't include this in production

            document.WEB_SOCKET_DEBUG = true;// Flash fallback logging - don't include this in production

            this.pusher = new Pusher('732a1df75d93d028e4f9');
            this.gameChannel = this.pusher.subscribe('Game-' + Y.Wegas.app.get("currentGame"));
            this.teamChannel = this.pusher.subscribe('Team-' + Y.Wegas.app.get("currentTeam"));
            this.playerChannel = this.pusher.subscribe('Player-' + Y.Wegas.app.get("currentPlayer"));
            
            // event response
            this.gameChannel.bind('wegas-event', Y.bind(function(data) {
                this.eventCase(data);
            }, this));
            this.teamChannel.bind('wegas-event', Y.bind(function(data) {
                this.eventCase(data);
            }, this));
            this.playerChannel.bind('wegas-event', Y.bind(function(data) {
                this.eventCase(data);
            }, this));
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

            this.get("host").rest.sendRequest({
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
        
        triggerEvent: function(){
            
        },
        
        eventCase: function(data){
            switch (data["@class"]) {
                case "VariableInstanceUpdate":
                    this.get("host").rest.updateCache(data);
                    break;

                case "CustomEvent":
                    this.fire(data.event.type, data.event);
                    break;
            }
        }
         
    }, {
        NS: "ws",
        NAME: "WebSocketListener"
    });
    Y.namespace('Plugin').WebSocketListener = WebSocketListener;

});
