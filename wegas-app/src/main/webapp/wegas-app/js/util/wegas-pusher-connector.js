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
YUI.add('wegas-pusher-connector', function(Y) {
    "use strict";

    var PusherConnector = Y.Base.create("wegas-pusher-connector", Y.Base, [], {


        initializer: function() {
            if(this.constructor.INSTANCE){
                return;
            }
            this.constructor.INSTANCE = this;
            Pusher.log = Y.log;    // Enable pusher logging - don't include this in production

            document.WEB_SOCKET_DEBUG = true;// Flash fallback logging - don't include this in production

            this.pusher = new Pusher('732a1df75d93d028e4f9');
            this.pusher.connection.bind( 'error', function( err ) { 
                if( err.data.code === 4004 ) {
                    Y.log("Pusher daily limit", "error", "Y.Plugin.WebSocketListener");
                }
            });
            this.gameChannel = this.pusher.subscribe('Game-' + Y.Wegas.app.get("currentGame"));
            this.teamChannel = this.pusher.subscribe('Team-' + Y.Wegas.app.get("currentTeam"));
            this.playerChannel = this.pusher.subscribe('Player-' + Y.Wegas.app.get("currentPlayer"));
        },
        
        registerEvent:function(eventType){
            this.publish(eventType);
            this.gameChannel.bind(eventType, Y.bind(this.fire, this, eventType));
            this.teamChannel.bind(eventType, Y.bind(this.fire, this, eventType));
            this.playerChannel.bind(eventType, Y.bind(this.fire, this, eventType)); 
        },
        
        unregisterEvent: function(eventType){
            this.getEvent(eventType).detach();
            this.gameChannel.unbind(eventType, Y.bind(this.fire, this, eventType));
            this.teamChannel.unbind(eventType, Y.bind(this.fire, this, eventType));
            this.playerChannel.unbind(eventType, Y.bind(this.fire, this, eventType)); 
        },
        
        /**
         *
         */
        triggerCustomEvent: function (channel, data, eventType) {
            var id;
            if (channel == "Game"){
                id = Y.Wegas.app.get("currentGame");
            } else if (channel == "Team"){
                id = Y.Wegas.app.get("currentTeam");
            } else {
                id = Y.Wegas.app.get("currentPlayer");
            }

            Y.Wegas.VariableDescriptorFacade.sendRequest({
                
                cfg: {
                    fullUri: Y.Wegas.app.get("base") + "rest/Pusher/Send/" + channel + "/" + id + "/" + eventType,
                    method: "POST",
                    data: data
                }
            });
        },
        
        onVariableInstanceUpdate: function(data){
            Y.Wegas.VariableDescriptorFacade.cache.onResponseRevived({
                serverResponse: Y.Wegas.Editable.revive({
                    "@class": "ManagedModeResponseFilter$ServerResponse",
                    events: [data]
                })
            });
        },
        
        destructor: function(){
            this.pusher.disconnect();
        }
    }, {
    });
    Y.namespace('Wegas').PusherConnector   = PusherConnector;

});

