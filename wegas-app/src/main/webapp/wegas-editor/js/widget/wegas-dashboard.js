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
    var CONTENTBOX = "contentBox";

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

            this.detailsOverlay = new Y.Overlay({
                zIndex: 100,
                width: this.get("width"),
                constrain: true,
                visible: false
            }).render();

            this.detailsOverlay.get("contentBox").addClass("wegas-dashboard-monitor--popup-overlay");
            this.detailsTarget = null;
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

                var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    teams = game.get("teams");

                if (teams.length === 0 || teams.length === 1 && teams[0].get("@class") === "DebugTeam") {
                    this.toolbar.add(new Y.Wegas.Button({
                        label: '<span class="wegas-icon wegas-icon-refresh"></span>No players have joined yet: click to check for new players',
                        cssClass: 'globalRefreshTitle',
                        on: {
                            click: Y.bind(function(event) {
                                location.reload(); // That's stupid, same as {@see phenixize}
                            }, this)
                        }
                    }));
                    return;
                }


                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span>Check for new players',
                    cssClass: 'globalRefreshTitle',
                    on: {
                        click: Y.bind(function(event) {
                            location.reload(); // That's stupid, same as {@see phenixize}
                        }, this)
                    }
                }));

                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-email"></span>',
                    cssClass: 'globalImpacts mailButton',
                    on: {
                        click: Y.bind(function(event) {
                            new Y.Wegas.EmailTeamModal({
                                "team": game,
                                "on": {
                                    "email:sent": function() {
                                        this.close();
                                    }
                                }
                            }).render();
                        }, this)
                    },
                    tooltip: 'Send real E-mail to all players'
                }));

                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-impacts"></span>',
                    cssClass: 'globalImpacts impactButton',
                    on: {
                        click: Y.bind(function(event) {
                            new Y.Wegas.ImpactsTeamModal({
                                "team": game
                            }).render();
                        }, this)
                    },
                    tooltip: 'Impact all players'
                }));


                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span>Monitoring',
                    cssClass: 'globalImpacts monitoredDataTitle',
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

                this.toolbar.add(new Y.Wegas.Button({
                    label: '<i class="fa fa-1x fa-wrench"></i> Recover Rights',
                    cssClass: 'globalImpacts monitoredDataTitle wegas-advanced-feature',
                    on: {
                        click: Y.bind(function() {
                            Y.Wegas.Facade.Game.sendRequest({
                                request: "/" + Y.Wegas.Facade.Game.cache.get("currentGameId") + "/recoverRights",
                                cfg: {
                                    method: "PUT",
                                    headers: {
                                        "Managed-Mode": false
                                    }
                                }
                            });

                        }, this)
                    }
                }));

                this._checkToolbarResize();

            }
        },
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Game.after("update", this.phenixize, this));
            this.handlers.push(Y.one("body").on("click", Y.bind(function(event) {
                this.detailsOverlay.hide();
                this.detailsTarget = null;
            }, this),
                this.detailsOverlay
                ));
        },
        /**
         * BEURK... Dirty Solution
         * @todo replace fuckin dirty clone'n'suicide pattern with slightly more intelligent sync
         * @returns {undefined}
         */
        phenixize: function() {
            return;
            var parent, childIndex,
                cfg = {
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
                try {
                    if (this.get("resize")) {
                        this.plug(Y.Wegas.CardsResizable);
                        this.CardsResizable.resetClassSize();
                        this.CardsResizable.resize();
                    }
                } catch (e) {
                } finally {
                    this._adjustTitles();
                    this.get("boundingBox").removeClass("loading");
                    return this.get("cardsData");
                }
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
            var blocs, newBlocs, newBloc, ctx = this;
            this._resetToInitialBlocs(data);
            blocs = data.blocs;
            if (monitoredBlocs !== null && monitoredBlocs.data && monitoredBlocs.data[data.id]) {
                monitoredBlocs.structure.forEach(function(blocsToAdd) {
                    newBlocs = {
                        "position": "left",
                        "cardBlocType": "monitoring",
                        "items": []
                    };
                    if (blocsToAdd.title) {
                        newBlocs.title = blocsToAdd.title;
                    }
                    if (blocsToAdd.cardBlocType) {
                        newBlocs.cardBlocType = blocsToAdd.cardBlocType;
                    }
                    blocsToAdd.items.forEach(function(bloc) {
                        var value = monitoredBlocs.data[data.id][bloc.id];
                        if (bloc.kind) {
                            var empty = value.empty;
                            if (bloc.kind === "inbox") {
                                bloc.do = Y.Wegas.Dashboard.prototype.onInboxClick;
                                bloc.icon = '<i class=' + (empty ? '"icon fa fa-comment-o"' : '"icon fa fa-commenting"') + ' title="Click to view"></i>';
                            } else if (bloc.kind === "text") {
                                bloc.do = Y.Wegas.Dashboard.prototype.onTextClick;
                                bloc.icon = '<i class=' + (empty ? '"icon fa fa-file-o"' : '"icon fa fa-file-text"') + ' title="Click to view"></i>';
                            } else {
                                bloc.value = "Error: unknown kind";
                            }
                        }
                        newBloc = {
                            label: bloc.label,
                            icon: bloc.icon,
                            value: value,
                            formatter: eval("(" + bloc.formatter + ")"),
                            do: bloc.do, //eval("(" + bloc.do + ")"),
                            kind: bloc.kind,
                            ctx: ctx // context of onclick callback, i.e. the wegas-dashboard-teams-overview singleton
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
        },
        // Centers button/titles if possible, otherwise hides them or reduces them inside their columns.
        _adjustTitles: function() {
            var cb = this.get(CONTENTBOX),
                card = cb.one(".card"); // We pick just any card
            if (!card) {
                return;
            }
            var monitoringBloc = card.one(".card__blocs--monitoring"),
                toolbar = cb.get("parentNode").one(".wegas-toolbar"),
                monitorTitle = toolbar.one(".monitoredDataTitle");
            if (monitoringBloc) {
                if (monitoringBloc.getY() === card.one(".card__blocs--action").getY()) {
                    // Horizontal space is sufficient:
                    monitorTitle.set("offsetWidth", monitoringBloc.get("offsetWidth") - 2); // Subtract a few pixels for vertical alignment despite borders etc.
                } else {
                    // Set to minimal width when monitoring and action blocs are misaligned due to lack of horizontal space
                    monitorTitle.setStyle("width", "auto");
                }
                monitorTitle.show();
            } else {
                // Hide monitoring title when there is no monitoring bloc
                monitorTitle.hide();
            }
        },
        _checkToolbarResize: function() {
            var ctx = this,
                resizeTimer = null;
            this.resizeHandle = Y.on("windowresize", function() { // use "windowresize" instead of just "resize"
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    ctx._adjustTitles();
                }, 10);
            });
        },
        onTextClick: function(event, text) {
            // In this callback, 'this' is undefined, therefore we get it through event.ctx
            var ctx = event.ctx;
            if (ctx.detailsOverlay.get("visible")) {
                ctx.detailsOverlay.hide();
            }
            if (event.currentTarget != ctx.detailsTarget) {
                ctx._display(text.title, text.body);
                ctx.detailsTarget = event.currentTarget;
            } else {
                ctx.detailsTarget = null;
            }
        },
        onInboxClick: function(event, inbox) {
            event.ctx.onTextClick(event, inbox);
        },
        _display: function(title, body) {
            var pdfLink = Y.Wegas.app.get("base") + "print.html",
                titleBar = '<div class="title">' + title + '</div><div class="fa fa-close closeIcon" title="Close window"></div><div class="saveIcon wegas-icon-pdf" title="Download PDF"></div>';
            this.detailsOverlay.set("headerContent", titleBar);
            this.detailsOverlay.get("contentBox").one(".saveIcon").on("click", function(event) {
                event.halt(true);
                this.post(pdfLink, {"title": this.toEntities(title), "body": this.toEntities(body), "outputType": "pdf"});
            }, this);
            this.detailsOverlay.setStdModContent('body', body);
            this.detailsOverlay.set("centered", true);
            this.detailsOverlay.show();
        },
        /*
         ** Opens a new tab where the given data is posted:
         */
        post: function(url, postData) {
            var tabWindowId = window.open('about:blank', '_blank');
            tabWindowId.document.title = postData.title;
            var form = tabWindowId.document.createElement("form");
            form.setAttribute("method", "post");
            form.setAttribute("action", url);

            for (var key in postData) {
                if (postData.hasOwnProperty(key)) {
                    var hiddenField = tabWindowId.document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", postData[key]);
                    form.appendChild(hiddenField);
                }
            }
            // var btn = tabWindowId.document.createElement("button"); btn.appendChild(tabWindowId.document.createTextNode("SUBMIT")); form.appendChild(btn);
            tabWindowId.document.body.appendChild(form);
            form.submit();
        },
        // Convert characters to HTML entities to protect against encoding issues:
        toEntities: function(text) {
            return text.replace(/[\u00A0-\u2666]/g, function(c) {
                return '&#' + c.charCodeAt(0) + ';';
            });
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
}, 'V1.0', {
    requires: ['node', 'event', 'event-resize']
});
