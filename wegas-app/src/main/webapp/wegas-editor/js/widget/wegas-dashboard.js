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
YUI.add('wegas-dashboard', function (Y) {
    "use strict";
    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard",
        Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
            CONTENT_TEMPLATE: "<div class='dashboard'></div>",
            initializer: function () {
                var context = this;
                context.get("cardsData").forEach(function (data) {
                    if (data.blocs && data.blocs.length > 0) {
                        context.get("cardsData").blocs.forEach(function (bloc) {
                            context._addOriginalBloc(data.id, bloc);
                        });
                    }
                });
                this.handlers = [];
            },
            destructor: function () {
                var i;
                for (i = 0; i < this.handlers.length; i += 1) {
                    this.handlers[i].detach();
                }
            },
            renderUI: function () {
                if (this.toolbar) {
                    this.toolbar.removeAll();

                    var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                        teams = game.get("teams"),
                        emptyGame = (teams.length===0 || teams.length===1 && teams[0].get("@class")==="DebugTeam");

                    this.toolbar.add(new Y.Wegas.Button({
                        label: '<span class="wegas-icon wegas-icon-refresh"></span>' + (emptyGame ? 'No players have joined yet: click to check for new players' : 'Check for new players'),
                        cssClass: 'globalRefreshTitle',
                        on: {
                            click: Y.bind(function (event) {
                                location.reload(); // That's stupid, same as {@see phenixize}
                            }, this)
                        }
                    }));

                    if (emptyGame){
                        return;
                    }

                    this.toolbar.add(new Y.Wegas.Button({
                        label: '<span class="wegas-icon wegas-icon-email"></span>',
                        cssClass: 'globalImpacts mailButton',
                        on: {
                            click: Y.bind(function (event) {
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
                            click: Y.bind(function (event) {
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
                            click: Y.bind(function (event) {
                                var button = event.target;
                                //this.phenixize();
                                if (button.get("boundingBox").hasClass("loading")) {
                                    return;
                                }
                                button.get("boundingBox").addClass("loading");
                                this.syncUI().then(function () {
                                    button.get("boundingBox").removeClass("loading");
                                });
                            }, this)
                        }
                    }));

                    this._checkToolbarResize();
                }
            },
            bindUI: function () {
                this.handlers.push(Y.Wegas.Facade.Game.after("update", this.phenixize, this));
            },
            /**
             * BEURK... Dirty Solution
             * @todo replace fuckin dirty clone'n'suicide pattern with slightly more intelligent sync
             * @returns {undefined}
             */
            phenixize: function () {
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
            syncUI: function () {
                var BB = this.get("boundingBox");
                BB.addClass("loading");
                return this._createCards().then(function (data) {
                    BB.removeClass("loading");
                    return data;
                });
            },
            getMonitoredData: function () {
                return this._monitoredData || {};
            },

            /**
             *
             * create cards as child
             * return Promise-> cardsData
             */
            _createCards: function () {
                return this._getMonitoredData().then(Y.bind(function (monitoredBlocs) {
                    this.destroyAll();
                    this._monitoredData = monitoredBlocs;
                    Y.Array.each(this.get("cardsData"), function (data) {
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
            _addOriginalBloc: function (idCard, originalBloc) {
                var originalBlocs = this.get("originalBlocs");
                if (!originalBlocs[idCard]) {
                    originalBlocs[idCard] = [];
                }
                originalBlocs[idCard].push(originalBloc);
                this.set("originalBlocs", originalBlocs);
            },
            _resetToInitialBlocs: function (data) {
                var originalBlocs = this.get("originalBlocs");
                data.blocs = [];
                if (originalBlocs[data.id]) {
                    originalBlocs[data.id].forEach(function (bloc) {
                        data.blocs.push(bloc);
                    });
                }
            },
            _combineBlocs: function (data, monitoredBlocs) {
                var blocs, newBlocs, newBloc;
                this._resetToInitialBlocs(data);
                blocs = data.blocs;
                if (monitoredBlocs !== null && monitoredBlocs.data && monitoredBlocs.data[data.id]) {
                    monitoredBlocs.structure.forEach(function (blocsToAdd) {
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
                        blocsToAdd.items.forEach(function (bloc) {
                            newBloc = {
                                label: bloc.label,
                                icon: bloc.icon,
                                value: monitoredBlocs.data[data.id][bloc.id],
                                formatter: eval("(" + bloc.formatter + ")"),
                                do: eval("(" + bloc.do + ")")
                            };
                            newBlocs.items.push(newBloc);
                        });
                        blocs.push(newBlocs);
                    });
                }
                return blocs;
            },
            _getMonitoredData: function () {
                var dashboards = Y.namespace("Wegas.Config.Dashboards"), script;
                if (dashboards && this.get("name") && dashboards[this.get("name")]) {
                    script = dashboards[this.get("name")];
                    return new Y.Promise(function (resolve, reject) {
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
                                success: function (e) {
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
            _adjustTitles: function () {
                var cb = this.get("contentBox"),
                    card = cb.one(".card"); // We pick just any card
                if (!card){
                    return;
                }
                var monitoringBloc = card.one(".card__blocs--monitoring"),
                    actionBloc = card.one(".card__blocs--action"),
                    toolbar = cb.get("parentNode"),
                    monitorTitle = toolbar.one(".monitoredDataTitle"),
                    globalTitle = toolbar.one(".globalRefreshTitle"),
                    toolbarWidth = toolbar.get("offsetWidth"),
                    monitorWidth;
                if (monitoringBloc && (monitorWidth = monitoringBloc.get("offsetWidth"))>10) {
                    if (monitoringBloc.getY()===actionBloc.getY()) {
                        // Horizontal space is sufficient:
                        var globalTitleWidth = toolbarWidth - (monitorWidth+actionBloc.get("offsetWidth"));
                        if (globalTitleWidth > 190) {
                            globalTitle.set("offsetWidth", globalTitleWidth - 56); // Subtract a constant number of pixels for borders and margins
                        } else {
                            globalTitle.setStyle("width", "auto");
                        }
                        monitorTitle.set("offsetWidth", monitorWidth);
                    } else {
                        // Set both to minimal width when monitoring and action blocs are misaligned due to lack of horizontal space
                        globalTitle.setStyle("width", "auto");
                        monitorTitle.setStyle("width", "auto");
                    }
                    monitorTitle.show();
                } else {
                    // Hide monitoring title when there is no monitoring bloc
                    monitorTitle.hide();
                    var globalTitleWidth = toolbarWidth - actionBloc.get("offsetWidth");
                    if (globalTitleWidth > 245){ // Minimal title width when the monitoring title is hidden ...
                        globalTitle.set("offsetWidth", globalTitleWidth-56); // Subtract a constant number of pixels for borders and margins???
                    } else {
                        globalTitle.setStyle("width", "auto");
                    }
                }
            },
            _getGameEmails: function () {
                return new Y.Promise(function (resolve, reject) {
                    var gameId = Y.Wegas.Facade.Game.cache.getCurrentGame().get("id");
                    Y.io(Y.Wegas.app.get("base") + "rest/Extended/User/Emails/" + gameId, {
                        cfg: {
                            method: "GET",
                            headers: {
                                "Managed-Mode": true
                            }
                        },
                        on: {
                            success: Y.bind(function (rId, xmlHttpRequest) {
                                resolve(JSON.parse(xmlHttpRequest.response));
                            }, this),
                            failure: Y.bind(function (rId, xmlHttpRequest) {
                                resolve("PERMISSION-ERROR");
                            }, this)
                        }
                    });
                });
            },
            // @param getEmails: promise for fetching the emails as an array of strings.
            // NB: this function is also used in sub-subclass Y.Wegas.TeamsOverviewDashboard
            displayEmails: function(getEmails){
                var newTab = window.open("", "_blank");
                newTab.document.write("<html><head><title>E-mail list</title></head><body>");
                newTab.document.write("<p><b>E-mail list in preparation...</b></p></body></html>");

                getEmails.then(function (emails) {
                    var nbValidEmails = 0,
                        nbGuests = 0,
                        mailtoHref = "mailto:",
                        mailtoText = "";

                    emails.forEach(function (email) {
                        if (email==="Guest"){
                            nbGuests++;
                            return;
                        }
                        if (++nbValidEmails === 1) {
                            mailtoHref += email;
                            mailtoText += email;
                        } else {
                            mailtoHref += ',' + email;
                            mailtoText += ', ' + email;
                        }
                    });

                    newTab.document.close();
                    newTab.document.write('<html><head><title>E-mail lists</title></head><body style="font-size:13px; font-family:Verdana, Geneva, sans-serif;">');
                    if (nbValidEmails > 0) {
                        if (nbValidEmails > 1) {
                            newTab.document.write('<b>' + nbValidEmails + ' comma-separated addresses (standard syntax) /<br/>' + nbValidEmails + ' adresses séparées par des virgules (syntaxe standard):</b><br/>');
                        }
                        newTab.document.write('<a href="' + mailtoHref + '?subject=Serious%20Game"><pre>' + mailtoText + "</pre></a>");
                        if (nbValidEmails > 1) {
                            newTab.document.write('<br/>&nbsp;<br/>');
                            mailtoHref = mailtoHref.replace(/,/g, ";");
                            mailtoText = mailtoText.replace(/,/g, ";");
                            newTab.document.write('<b>' + nbValidEmails + ' semicolon-separated addresses (for Microsoft Outlook) /<br/>' + nbValidEmails + ' adresses séparées par des point-virgules (pour Microsoft Outlook) :</b><br/>');
                            newTab.document.write('<a href="' + mailtoHref + '?subject=Serious%20Game"><pre>' + mailtoText + "</pre></a>");
                        }
                    } else {
                        newTab.document.write('No registered user / Aucun joueur enregistré<br/>&nbsp;');
                    }
                    if (nbGuests > 0) {
                        var plural = nbGuests>1 ? 's' : '';
                        newTab.document.write('<br/><span style="color:red">Attention:</span> ' + nbGuests + ' anonymous player'+plural+', hence without e-mail / ' + nbGuests + ' joueur'+plural+' anonyme'+plural+', donc sans e-mail.');
                    }
                    newTab.document.close();
                });
            },

            // @param emailsArray: emails as an array of strings.
            // NB: this function is used in sub-subclass Y.Wegas.TeamsOverviewDashboard
            formatEmails: function(emailsArray){
                var nbValidEmails = 0,
                    mailtoText = "";

                emailsArray.forEach(function (email) {
                    if (email==="Guest"){
                        return;
                    }
                    if (++nbValidEmails === 1) {
                        mailtoText += email;
                    } else {
                        mailtoText += ', ' + email;
                    }
                });
                return mailtoText;
            },
            _checkToolbarResize: function () {
                var ctx = this,
                    resizeTimer = null;
                this.resizeHandle = Y.on("windowresize", function () { // use "windowresize" instead of just "resize"
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function() {
                        ctx._adjustTitles();
                    }, 250);
                });
            },

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
    requires: ['event','event-resize']
});
