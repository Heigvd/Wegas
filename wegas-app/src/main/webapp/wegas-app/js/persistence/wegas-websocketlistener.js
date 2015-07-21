/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-websocketlistener', function(Y) {
    "use strict";

    var WebSocketListener = Y.Base.create("WebSocketListener", Y.Plugin.Base, [], {
        initializer: function() {
            Y.later(50, this, function() { //let ds render.
                var dataSource = Y.Wegas.Facade[this.get("dataSource")];
                if (dataSource) {
                    this._hdl = [];
                    this._hdl.push(dataSource.on("EntityUpdatedEvent", this.onVariableInstanceUpdate, this));
                    this._hdl.push(dataSource.on("CustomEvent", this.onVariableInstanceUpdate, this));
                    this._hdl.push(dataSource.on("LifeCycleEvent", this.onLifeCycleEvent, this));
                }
            });
        },
        onLifeCycleEvent: function(data) {
            var payload = Y.JSON.parse(data),
                cache = this.get("host").cache,
                node = Y.Widget.getByNode(".wegas-login-page") ||
                (Y.Widget.getByNode("#centerTabView") &&
                    Y.Widget.getByNode("#centerTabView").get("selection")) ||
                Y.Widget.getByNode(".wegas-playerview");

            if (payload.status === "DOWN") {
                node.showOverlay("maintenance");
            } else if (payload.status === "READY") {
                node.hideOverlay("maintenance");
            } else if (payload.status === "OUTDATED") {
                node.showMessage("error", "Some of your data are outdated, please refresh the page");
            } else {
                node.showMessage("warn", "Unexcpected Error: Please refresh the page");
                node.showOverlay("error");
            }
        },
        onVariableInstanceUpdate: function(data) {
            Y.log("Websocket event received.", "info", "Wegas.WebsocketListener");
            this.get("host").cache.onResponseRevived({
                serverResponse: Y.Wegas.Editable.revive({
                    "@class": "ManagedResponse",
                    events: [Y.JSON.parse(data)]
                })
            });
        },
        destructor: function() {
            var i;
            if (this._hdl) {
                for (i in this._hdl) {
                    this._hdl[i].detach();
                }
            }
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
    Y.Plugin.WebSocketListener = WebSocketListener;

});
