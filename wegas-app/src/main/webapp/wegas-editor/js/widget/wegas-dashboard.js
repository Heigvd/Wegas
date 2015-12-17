/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Wegas Dashboard - V2
 * @author Raphaël Schmutz <raph@hat-owl.cc>
 */
YUI.add('wegas-dashboard', function(Y) {
    "use strict";
    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard",
        Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class='dashboard'></div>",
        initializer: function() {
            var context = this;
            context.get("cardsData").forEach(function(data) {
                if (data.blocs && data.blocs.length > 0) {
                    context.get("cardsData").blocs.forEach(function(bloc) {
                        context._addOriginalBloc(data.id, bloc);
                    });
                }
            });
            this.handlers = [];
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        renderUI: function() {
            if (this.toolbar) {
                this.toolbar.removeAll();
                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span> Refresh',
                    on: {
                        click: Y.bind(function(event) {
                            var button = event.target;
                            //this.phenixize();
                            if (button.get("boundingBox").hasClass("loading")) {
                                return;
                            }
                            button.get("boundingBox").addClass("loading");
                            this.syncUI().then(function() {
                                button.get("boundingBox").removeClass("loading");
                            });
                        }, this)
                    }
                }));
            }
        },
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Game.after("update", this.phenixize, this));
        },
        /**
         * BEURK... Dirty Solution 
         * @todo replace fuckin dirty clone'n'suicide pattern with slightly more intelligent sync
         * @returns {undefined}
         */
        phenixize: function() {
            return;
            var parent, childIndex, cfg = {
                "name": "overview",
                "type": "TeamsOverviewDashboard",
                "remoteScript": "",
                "plugins": [
                    {
                        "fn": "WidgetToolbar"
                    }
                ]
            };

            parent = this.get("parent");
            if (parent) {
                childIndex = parent.indexOf(this);
                if (childIndex >= 0) {
                    parent.remove(childIndex);
                }
                parent.add(Y.Wegas.Widget.create(cfg));
                if (childIndex >= 0) {
                    this.destroy();
                }
            }
        },
        syncUI: function() {
            var BB = this.get("boundingBox");
            BB.addClass("loading");
            return this._createCards().then(function(data) {
                BB.removeClass("loading");
                return data;
            });
        },
        getMonitoredData: function() {
            return this._monitoredData || {};
        },
        /**
         *
         * create cards as child
         * return Promise-> cardsData
         */
        _createCards: function() {
            return this._getMonitoredData().then(Y.bind(function(monitoredBlocs) {
                this.destroyAll();
                this._monitoredData = monitoredBlocs;
                Y.Array.each(this.get("cardsData"), function(data) {
                    var card = {
                        "id": data.id,
                        "title": data.title,
                        "icon": data.icon || null,
                        "blocs": this._combineBlocs(data, monitoredBlocs)
                    };
                    this.add(new Y.Wegas.Card(card));
                }, this);
                if (this.get("resize")) {
                    this.plug(Y.Wegas.CardsResizable);
                    this.CardsResizable.resetClassSize();
                    this.CardsResizable.resize();
                }
                return this.get("cardsData");
            }, this));
        },
        _addOriginalBloc: function(idCard, originalBloc) {
            var originalBlocs = this.get("originalBlocs");
            if (!originalBlocs[idCard]) {
                originalBlocs[idCard] = [];
            }
            originalBlocs[idCard].push(originalBloc);
            this.set("originalBlocs", originalBlocs);
        },
        _resetToInitialBlocs: function(data) {
            var originalBlocs = this.get("originalBlocs");
            data.blocs = [];
            if (originalBlocs[data.id]) {
                originalBlocs[data.id].forEach(function(bloc) {
                    data.blocs.push(bloc);
                });
            }
        },
        _combineBlocs: function(data, monitoredBlocs) {
            var blocs, newBlocs, newBloc;
            this._resetToInitialBlocs(data);
            blocs = data.blocs;
            if (monitoredBlocs !== null && monitoredBlocs.data && monitoredBlocs.data[data.id]) {
                monitoredBlocs.structure.forEach(function(blocsToAdd) {
                    newBlocs = {
                        "position": "left",
                        "type": "monitoring",
                        "items": []
                    };
                    if (blocsToAdd.title) {
                        newBlocs.title = blocsToAdd.title;
                    }
                    blocsToAdd.items.forEach(function(bloc) {
                        newBloc = {
                            label: bloc.label,
                            value: monitoredBlocs.data[data.id][bloc.id],
                            formatter: eval("(" + bloc.formatter + ")")
                        };
                        newBlocs.items.push(newBloc);
                    });
                    blocs.push(newBlocs);
                });
            }
            return blocs;
        },
        _getMonitoredData: function() {
            var dashboards = Y.namespace("Wegas.Config.Dashboards"), script;
            if (dashboards && this.get("name") && dashboards[this.get("name")]) {
                script = dashboards[this.get("name")];
                return new Y.Promise(function(resolve, reject) {
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/Script/Run/" + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id"),
                        cfg: {
                            method: "POST",
                            headers: {
                                "Managed-Mode": false
                            },
                            data: {
                                "@class": "Script",
                                content: script
                            }
                        },
                        on: {
                            success: function(e) {
                                resolve(e.response.results);
                            },
                            failure: reject
                        }
                    });
                });
            } else {
                return Y.Promise.resolve(null);
            }
        }
    },
        {
            "ATTRS": {
                "name": {
                    value: null
                },
                "cardsData": {
                    value: []
                },
                "resize": {
                    value: true
                },
                "quickAccess": {
                    value: null
                },
                "originalBlocs": {
                    value: {}
                }
            }
        });
});
