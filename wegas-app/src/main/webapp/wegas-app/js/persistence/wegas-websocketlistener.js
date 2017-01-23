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
                    this._hdl.push(dataSource.on("OutdatedEntitiesEvent", this.forceEntityUpdate, this));
                    this._hdl.push(dataSource.on("EntityDestroyedEvent", this.onEntityDeletion, this));
                    this._hdl.push(dataSource.on("CustomEvent", this.onCustomEvent, this));
                    this._hdl.push(dataSource.on("LockEvent", this.onLockEvent, this));
                    this._hdl.push(dataSource.on("LifeCycleEvent", this.onLifeCycleEvent, this));
                }
            });
        },
        _before: function(token) {
            var node = Y.Widget.getByNode(".wegas-login-page") ||
                Y.Widget.getByNode(".wegas-editview") ||
                Y.Widget.getByNode(".wegas-trainer--app") ||
                Y.Widget.getByNode(".wegas-playerview");
            if (Y.one("body").hasClass("wegas-advancedmode")) {
                node.showOverlay(token);
            }
        },
        _after: function(token) {
            var node = Y.Widget.getByNode(".wegas-login-page") ||
                Y.Widget.getByNode(".wegas-editview") ||
                Y.Widget.getByNode(".wegas-trainer--app") ||
                Y.Widget.getByNode(".wegas-playerview");
            if (Y.one("body").hasClass("wegas-advancedmode")) {
                node.hideOverlay(token);
            }
        },
        onLockEvent: function(data) {
            if (Y.Wegas.app.lockmanager) {
                var payload = Y.JSON.parse(data);
                if (payload.status === "lock") {
                    Y.Wegas.app.lockmanager.lock(payload.token);
                } else {
                    Y.Wegas.app.lockmanager.unlock(payload.token);
                }
            }
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
            this._before();
            Y.later(0, this, function() {
                var datasource, entities, entity, i;
                entities = Y.JSON.parse(data).deletedEntities;
                for (i = 0; i < entities.length; i += 1) {
                    datasource = this.getDatasourceFromClassName(entities[i]["@class"]);
                    entity = datasource.cache.find("id", entities[i].id);
                    if (entity) {
                        // due to the parent-child descriptors organisation, such a 
                        // destroyed descriptor may have already been deleted from 
                        // the cache while updating its parent...
                        // -> Avoid deleting notfound entities
                        datasource.cache.updateCache("DELETE", entity, false);
                    } else {
                        // Send the corresponding delete "event"
                        entity = Y.Wegas.Editable.revive(entities[i]);
                        datasource.fire("delete", {"entity": entity});
                    }
                }
                this._after();
            });
        },
        onCustomEvent: function(data) {
        },
        forceEntityUpdate: function(data) {
            this._before();
            Y.later(0, this, function() {
                var parsed = Y.JSON.parse(data), i, entity, request = null, ds, toUpdate;

                toUpdate = {
                    instances: [],
                    descriptors: []
                };

                for (i = 0; i < parsed.updatedEntities.length; i += 1) {
                    entity = Y.Wegas.Editable.revive(parsed.updatedEntities[i]);

                    ds = this.getDatasourceFromEntity(entity);
                    if (entity instanceof Y.Wegas.persistence.VariableInstance) {
                        toUpdate.instances.push(entity.get("id"));
                    } else if (entity instanceof Y.Wegas.persistence.VariableDescriptor) {
                        toUpdate.descriptors.push(entity.get("id"));
                    }
                }
                if (toUpdate.instances.length > 0) {
                    Y.Wegas.Facade.Instance.sendRequest({
                        request: "/VariableInstance/ByIds",
                        cfg: {
                            method: "post",
                            data: toUpdate.instances
                        }
                    });
                }

                if (toUpdate.descriptors.length > 0) {
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/ByIds",
                        cfg: {
                            method: "post",
                            data: toUpdate.descriptors
                        }
                    });
                }

                this._after();
            });
        },
        onEntityUpdatedEvent: function(data) {
            var token = "pusher-update",
                i, event = Y.JSON.parse(data), entity,
                allDs = [],
                datasource, dsId, remappedEntities = {};
            Y.log("Websocket event received.", "info", "Wegas.WebsocketListener");
            this._before(token);
            Y.later(0, this, function() {
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

                /*
                 * Do not update instance cache before descriptor one (when adding new entities !)
                 * Not a pretty solution....
                 */
                allDs.push(Y.Wegas.Facade.Game._yuid);
                allDs.push(Y.Wegas.Facade.Variable._yuid);
                allDs.push(Y.Wegas.Facade.Instance._yuid);

                for (i in allDs) {
                    dsId = allDs[i];
                    if (remappedEntities.hasOwnProperty(dsId)) {
                        Y.log("Update [" + dsId + "] : " + JSON.stringify(remappedEntities[dsId].entities));
                        remappedEntities[dsId].datasource.cache.fire("EntityUpdatedEvent", {
                            "@class": "EntityUpdatedEvent",
                            updatedEntities: remappedEntities[dsId].entities
                        });
                    }
                }
                this._after(token);
            });
        },
        getDatasourceFromEntity: function(entity) {
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
        getDatasourceFromClassName: function(className) {
            return this.getDatasourceFromEntity(new Y.Wegas.persistence[className]());
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
