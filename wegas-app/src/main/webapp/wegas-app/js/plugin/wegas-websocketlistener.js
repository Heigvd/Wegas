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
            new Y.Wegas.PusherConnector();
            this.pusher = Y.Wegas.PusherConnector.INSTANCE;
            this.pusher.registerEvent("EntityUpdatedEvent");
            this.pusher.on("*:EntityUpdatedEvent", this.onVariableInstanceUpdate, this);
        },
        
        onVariableInstanceUpdate: function(data){
            this.get("host").cache.onResponseRevived({
                serverResponse: Y.Wegas.Editable.revive({
                    "@class": "ManagedModeResponseFilter$ServerResponse",
                    events: [data]
                })
            });
        },
        destructor: function(){
            this.pusher.unregisterEvent("EntityUpdatedEvent");
        }
    }, {
        NS: "ws",
        NAME: "WebSocketListener"
    });
    Y.namespace('Plugin').WebSocketListener = WebSocketListener;

});
