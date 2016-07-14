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
YUI.add('wegas-websocketlistener', function (Y) {
    "use strict";

    var WebSocketListener = Y.Base.create("WebSocketListener", Y.Plugin.Base, [], {
        initializer: function () {
            Y.later(50, this, function () { //let ds render.
                var dataSource = Y.Wegas.Facade[this.get("dataSource")];
                if (dataSource) {
                    this._hdl = [];
                    this._hdl.push(dataSource.on("EntityUpdatedEvent", this.onEntityUpdatedEvent, this));
                    this._hdl.push(dataSource.on("OutdatedEntitiesEvent", this.forceEntityUpdate, this));
                    this._hdl.push(dataSource.on("EntityDestroyedEvent", this.onEntityDeletion, this));
                    this._hdl.push(dataSource.on("CustomEvent", this.onCustomEvent, this));
                    this._hdl.push(dataSource.on("LifeCycleEvent", this.onLifeCycleEvent, this));
                }
            });
        },
        onLifeCycleEvent: function (data) {
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
        onEntityDeletion: function (data) {
            var datasource, entities, entity, i;
            entities = Y.JSON.parse(data).deletedEntities;
            for (i = 0; i < entities.length; i += 1) {
                entity = Y.Wegas.Editable.revive(entities[i]);
                datasource = this.getDatasourceFromEntity(entity);
                datasource.cache.updateCache("DELETE", entity, false);
            }
        },
        onCustomEvent: function (data) {

        },
        forceEntityUpdate: function (data) {
            var parsed = Y.JSON.parse(data), i, entity, request = null;
            for (i = 0; i < parsed.updatedEntities.length; i += 1) {
                entity = Y.Wegas.Editable.revive(parsed.updatedEntities[i]);

                if (entity instanceof Y.Wegas.persistence.VariableInstance) {
                    request = "//VariableInstance/" + entity.get("id");
                } else if (entity instanceof Y.Wegas.persistence.VariableDescriptor) {
                    request = "/" + entity.get("id");
                }

                if (request) {
                    this.get("host").sendRequest({
                        request: request
                    });
                }
            }
        },
        onEntityUpdatedEvent: function (data) {
            var i, event = Y.JSON.parse(data), entity,
                datasource, dsId, remappedEntities = {};
            Y.log("Websocket event received.", "info", "Wegas.WebsocketListener");

            for (i = 0; i < event.updatedEntities.length; i += 1) {
                // TODO FETCH CORRECT CACHE
                entity = Y.Wegas.Editable.revive(event.updatedEntities[i]);
                datasource = this.getDatasourceFromEntity(entity);
                if (datasource) {
                    dsId = datasource._yuid;
                    remappedEntities[dsId] = remappedEntities[dsId] || {entities: [], datasource: datasource};
                    remappedEntities[dsId].entities.push(entity);
                }
            }

            for (dsId in remappedEntities) {
                if (remappedEntities.hasOwnProperty(dsId)) {
                    remappedEntities[dsId].datasource.cache.fire("EntityUpdatedEvent", {
                        "@class": "EntityUpdatedEvent",
                        updatedEntities: remappedEntities[dsId].entities
                    });
                }
            }
        },
        getDatasourceFromEntity: function (entity) {
            if (entity instanceof Y.Wegas.persistence.VariableInstance) {
                return Y.Wegas.Facade.Instance;
            } else if (entity instanceof Y.Wegas.persistence.VariableDescriptor) {
                return Y.Wegas.Facade.Variable;
            } else if (entity instanceof Y.Wegas.persistence.Game) {
                return Y.Wegas.Facade.Game;
            } else {
                return null;
            }
        },
        destructor: function () {
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
