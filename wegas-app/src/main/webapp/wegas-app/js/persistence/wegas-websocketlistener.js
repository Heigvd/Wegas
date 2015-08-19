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
                    this._hdl.push(dataSource.on("EntityUpdatedEvent", this.onEntityUpdatedEvent, this));
                    this._hdl.push(dataSource.on("EntityDestroyedEvent", this.onEntityDeletion, this));
                    this._hdl.push(dataSource.on("CustomEvent", this.onCustomEvent, this));
                    this._hdl.push(dataSource.on("LifeCycleEvent", this.onLifeCycleEvent, this));
                }
            });
        },
        onLifeCycleEvent: function(data) {
            var payload = Y.JSON.parse(data),
                node = Y.Widget.getByNode(".wegas-login-page") ||
                Y.Widget.getByNode(".wegas-editview") ||
                Y.Widget.getByNode(".wegas-trainer--app") ||
                Y.Widget.getByNode(".wegas-playerview");
                /*(Y.Widget.getByNode("#centerTabView") &&
                    Y.Widget.getByNode("#centerTabView").get("selection")) ||
                ;*/

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
        onEntityDeletion: function(data) {
            var datasource, entities, entity, i;
            entities = Y.JSON.parse(data).deletedEntities;
            for (i = 0; i < entities.length; i += 1) {
                entity = Y.Wegas.Editable.revive(entities[i]);
                datasource = this.getDatasourceFromEntity(entity);
                datasource.cache.updateCache("DELETE", entity, false);
            }
        },
        onCustomEvent: function(data) {
            
        },
        onEntityUpdatedEvent: function(data) {
            var i, event = Y.JSON.parse(data), entity,
                datasource;
            Y.log("Websocket event received.", "info", "Wegas.WebsocketListener");

            for (i = 0; i < event.updatedEntities.length; i += 1) {
                // TODO FETCH CORRECT CACHE
                entity = Y.Wegas.Editable.revive(event.updatedEntities[i]);
                datasource = this.getDatasourceFromEntity(entity);
                if (datasource){
                    datasource.cache.fire("EntityUpdatedEvent", {
                        "@class": "EntityUpdatedEvent",
                        updatedEntities: [entity]
                    })
                }
            }
        },
        getDatasourceFromEntity : function(entity){
            if (entity instanceof Y.Wegas.persistence.VariableInstance || entity instanceof Y.Wegas.persistence.VariableDescriptor){
                return Y.Wegas.Facade.Variable;
            }  else {
                return null;
            }
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
