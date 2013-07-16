/*
 * Wegas
 * http://wegas.albasim.ch
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
            Y.Wegas.Facade[this.get("dataSource")].on("EntityUpdatedEvent", this.onVariableInstanceUpdate, this);
        },
        onVariableInstanceUpdate: function(data) {
            Y.log("Websocket event received.", "info", "Wegas.WebsocketListener");
            this.get("host").cache.onResponseRevived({
                serverResponse: Y.Wegas.Editable.revive({
                    "@class": "ManagedModeResponseFilter$ServerResponse",
                    events: [data]
                })
            });
        },
        destructor: function() {
        }
    }, {
        ATTRS: {
            dataSource: {
                initOnly: true
            }
        },
        NS: "ws",
        NAME: "WebSocketListener"
    });
    Y.namespace('Plugin').WebSocketListener = WebSocketListener;

});
