/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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
                    this._hdl.push(dataSource.on("PageUpdate", this.onPageUpdate, this));
                    this._hdl.push(dataSource.on("PageIndexUpdate", this.onPageIndexUpdate, this));
                    this._hdl.push(dataSource.on("LockEvent", this.onLockEvent, this));
                    this._hdl.push(dataSource.on("LifeCycleEvent", this.onLifeCycleEvent, this));

                    this._hdl.push(dataSource.on("LibraryUpdate-CSS", this.onCssUpdate, this));
                    this._hdl.push(dataSource.on("LibraryUpdate-ClientScript", this.onClientScriptUpdate, this));
                    this._hdl.push(dataSource.on("LibraryUpdate-ServerScript", this.onServerScriptUpdate, this));
                }
            });
        },
        _getNode: function() {
            return Y.Widget.getByNode(".wegas-login-page") ||
                Y.Widget.getByNode(".wegas-editview") ||
                Y.Widget.getByNode(".wegas-trainer--app") ||
                Y.Widget.getByNode(".wegas-playerview");
        },
        _before: function(token) {
            var node = this._getNode();
            if (Y.one("body").hasClass("wegas-advancedmode")) {
                node.showOverlay(token);
            }
        },
        _after: function(token) {
            var node = this._getNode();
            if (Y.one("body").hasClass("wegas-advancedmode")) {
                node.hideOverlay(token);
            }
        },
        onLockEvent: function(payload) {
            if (Y.Wegas.app.lockmanager) {
                if (payload.status === "lock") {
                    Y.Wegas.app.lockmanager.lock(payload.token);
                } else {
                    Y.Wegas.app.lockmanager.unlock(payload.token);
                }
            }
        },
        onPageUpdate: function(pageId) {
            Y.Wegas.Facade.Page.cache.forceUpdate(pageId);
        },
        onPageIndexUpdate: function(pageId) {
            Y.Wegas.Facade.Page.cache.forceIndexUpdate();
        },
        loadLibrary: function(type, key, cb) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + '/Library/' + type + "/" + key + '/?view=Export',
                cfg: {
                    updateCache: false
                },
                on: {
                    success: Y.bind(function(data) {
                        // is there any editor ?
                        Y.all(".wegas-scriptlibrary").each(function(node) {
                            var widget = Y.Widget.getByNode(node);
                            if (widget && widget.get("library") === type) {
                                if (!widget.toolbar.get("header").one(".wegas-outdated-message")) {
                                    var outdated = new Y.Node.create('<span class="wegas-outdated-message">Something is outdated: reload the library tab</span>');
                                    widget.toolbar.get("header").append(outdated);
                                }

                                for (var k  in widget.selectField.choicesList) {
                                    if (widget.selectField.choicesList[k].value === key) {
                                        if (widget.selectField.choicesList[k].node.innerHTML.indexOf("OUTDATED") < 0) {
                                            widget.selectField.choicesList[k].node.innerHTML += " <- OUTDATED<i class='fa fa-warn'>";
                                        }
                                    }
                                }

                            }
                        }, this);
                        if (cb) {
                            cb.call(this, data.response.entity.get("content"));
                        }
                    }, this)
                }
            });

        },
        onCssUpdate: function(contentKey) {
            this.loadLibrary("CSS", contentKey, function(stylesheet) {
                Y.Plugin.CSSLoader.updateStyleSheet(contentKey, stylesheet);
            });
        },
        onClientScriptUpdate: function(contentKey) {
            this.loadLibrary("ClientScript", contentKey, function(clientScript) {
                W.Sandbox.eval(clientScript, undefined, true);
            });
        },
        onServerScriptUpdate: function(contentKey) {
            this.loadLibrary("ServerScript", contentKey);
        },
        onLifeCycleEvent: function(payload) {
            var node = this._getNode();
            /*(Wegas.TabView.getPreviewTabView() &&
             Wegas.TabView.getPreviewTabView().get("selection")) ||
             ;*/

            if (payload.status === "DOWN") {
                node.showOverlay("maintenance");
            } else if (payload.status === "READY") {
                node.hideOverlay("maintenance");
            } else if (payload.status === "OUTDATED") {
                //node.showMessage("error", "Some of your data are outdated, please refresh the page");
                Y.Wegas.Alerts.showBanner("Some of your data are outdated, please <a href=\"#\" onClick=\"window.location.reload()\">reload</a> the page", {className: 'alert', iconCss: "fa fa-2x fa-warning"});
            } else {
                node.showMessage("warn", "Unexcpected Error: Please refresh the page");
                node.showOverlay("error");
            }
        },
        onEntityDeletion: function(data) {
            this._before();
            Y.later(0, this, function() {
                var datasource, entities, entity, i, collector = {};
                entities = Y.JSON.parse(data).deletedEntities;
                for (i = 0; i < entities.length; i += 1) {
                    datasource = this.getDatasourceFromClassName(entities[i]["@class"]);
                    entity = datasource.cache.find("id", entities[i].id);
                    if (entity) {
                        // due to the parent-child descriptors organisation, such a
                        // destroyed descriptor may have already been deleted from
                        // the cache while updating its parent...
                        // -> Avoid deleting notfound entities
                        datasource.cache.updateCache("DELETE", entity, collector);
                    } else {
                        // Send the corresponding delete "event"
                        entity = Y.Wegas.Editable.revive(entities[i]);
                        datasource.fire("delete", {"entity": entity});
                    }
                }

                Y.Wegas.Facade.Variable.sendEventsFromCollector(collector);
                this._after();
            });
        },
        onCustomEvent: function(payload) {
            Y.Wegas.Facade.Variable.fire(payload.type, payload.payload);
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
                    entity = Y.Wegas.Editable.revive({
                        "@class": parsed.updatedEntities[i].type,
                        id: parsed.updatedEntities[i].id
                    });

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
                var collector = {}, ds;
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
                        remappedEntities[dsId].datasource.cache.updateEntities(remappedEntities[dsId].entities, collector);
                    }
                }


                Y.Wegas.Facade.Variable.sendEventsFromCollector(collector);

                this._after(token);
            });
        },
        getDatasourceFromEntity: function(entity) {
            if (entity instanceof Y.Wegas.persistence.VariableInstance) {
                return Y.Wegas.Facade.Instance;
            } else if (entity instanceof Y.Wegas.persistence.VariableDescriptor ||
                entity instanceof Y.Wegas.persistence.GameModel) {
                return Y.Wegas.Facade.Variable;
            } else if (entity instanceof Y.Wegas.persistence.Player ||
                entity instanceof Y.Wegas.persistence.Team ||
                entity instanceof Y.Wegas.persistence.Game) {
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
