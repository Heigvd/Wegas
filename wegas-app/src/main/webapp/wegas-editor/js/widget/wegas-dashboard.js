/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * Wegas Dashboard - V3
 * @author Maxence Laurent
 */
YUI.add('wegas-dashboard', function(Y) {
    "use strict";

    var DEFAULT_TABLE_STRUCTURE,
        TITLE_TEMPLATE = "<span class='team-name'></span>",
        LINK_TEMPLATE = "<span class='details__link details__link__closed'>Details</span>",
        BASE_TEMPLATE = "<div><div class='team-details__notes'><textarea class='infos-comments' placeholder='Enter a comment here'></textarea></div>" + "</div>",
        TEAM_LIST_TEMPLATE = "<div class='team-details__players'><ul class='team-details__players__list'></ul>" + "</div>",
        DEFAULT_TABLE_STRUCTURE = {
            title: "",
            def: {
                impacts: {
                    "label": "Impact",
                    "itemType": "group",
                    "items": {
                        impacts: {
                            "icon": "fa fa-pencil",
                            "itemType": "action",
                            "label": "Impact variables",
                            "hasGlobal": true,
                            "do": function(team, payload) {
                                new Y.Wegas.ImpactsTeamModal({
                                    "team": team
                                }).render();
                            }
                        }
                    }
                },
                actions: {
                    "label": "Actions",
                    "itemType": "group",
                    "items": {
                        sendmail: {
                            "icon": "fa fa-envelope",
                            "itemType": "action",
                            "label": "Send real E-Mail",
                            "hasGlobal": true,
                            "do": function(team, payload) {
                                new Y.Wegas.EmailTeamModal({
                                    "team": team,
                                    "on": {
                                        "email:sent": function() {
                                            this.close();
                                        }
                                    }
                                }).render();
                            }
                        },
                        view: {
                            "icon": "info-view",
                            "itemType": "action",
                            "label": "View playing session",
                            "hasGlobal": false,
                            "do": function(team, payload) {
                                window.open("game-lock.html?id=" + team.get("players")[0].get("id"), "_blank");
                            }
                        }
                    }
                }
            }
        };

    Y.Wegas.DashboardDatatable = Y.Base.create("wegas-dashboard-datatable", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class='dashboard-table-title'></div>" +
            "<div class='dashboard-table-data'></div>" +
            "</div>",
        initializer: function() {
            this.dt = this.get("datatable");
        },
        renderUI: function() {
            var title = this.get("title");
            if (title) {
                this.get("contentBox").one(".dashboard-table-title").setContent(title);
                this.get("contentBox").addClass("with-table-title");
            }
            this.dt.render(this.get("contentBox").one(".dashboard-table-data"));
        },
        syncUI: function() {
        },
        destructor: function() {
            this.dt.destroy();
        }
    }, {
        ATTRS: {
            datatable: "object",
            openByDefault: {
                type: "boolean",
                value: true,
                optionnal: true
            },
            title: {
                type: "string",
                optionnal: true,
                value: null
            }
        }
    });



    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class='dashboard-v3'></div>",
        initializer: function() {
            this.handlers = {};
            this._freeForAll = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll");

            this.datatables = {};

            this.detailsOverlay = new Y.Overlay({
                zIndex: 100,
                width: this.get("width"),
                constrain: true,
                visible: false
            }).render();

            this.detailsOverlay.get("contentBox").addClass("wegas-dashboard-monitor--popup-overlay");
            this.detailsTarget = null;
        }
        ,
        destructor: function() {
            var i;
            for (i in this.handlers) {
                if (this.handlers.hasOwnProperty(i)) {
                    this.handlers[i].detach();
                }
            }
        },
        renderUI: function() {
            this.addButtons();
        },
        addButtons: function() {
            var label = "Refresh",
                game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                teams = game.get("teams");

            if (teams.length === 0 || teams.length === 1 && teams[0].get("@class") === "DebugTeam") {
                label = "No players have joined yet";
            }

            this.add(new Y.Wegas.Button({
                label: '<span class="wegas-icon wegas-icon-refresh"></span> ' + label,
                cssClass: 'refreshButton',
                on: {
                    click: Y.bind(function(event) {
                        this.syncUI();
                    }, this)
                }
            }));
        },
        onGameUpdate: function() {
            this.get("contentBox").one(".refreshButton").addClass("please-refresh fa fa-asterisk");
        },
        bindUI: function() {
            this.handlers.onGameUpdate = Y.Wegas.Facade.Game.after("update", this.onGameUpdate, this);

            this.get("contentBox").delegate("click", this.actionClick, ".dashboard-action.enabled", this);
            this.get("contentBox").delegate("click", this.detailsClick, ".details__link", this);

            this.get("contentBox").delegate("click", this.onBooleanClick, ".bloc__boolean", this);
            this.get("contentBox").delegate("click", this.onTextClick, ".bloc__text", this);

            Y.Wegas.app.once('ready', Y.bind(this.syncUI, this));

            this.handlers.onBodyClick = Y.one("body").on("click", Y.bind(function(event) {
                this.closeDetails();
            }, this), this.detailsOverlay);
        },
        syncUI: function() {
            var BB = this.get("boundingBox");
            //BB.addClass("loading");
            this.get("contentBox").one(".refreshButton span").addClass(" fa-pulse");
            this._loadRemoteData();
        },
        detailsClick: function(e) {
            var datatable = Y.Widget.getByNode(e.target),
                record = datatable.getRecord(e.target).getAttrs(),
                team = record.team,
                cell = datatable.getCell(e.target),
                trDetails = datatable.get("contentBox").one("tr[data-teamid='" + team.get("id") + "']"),
                theTr = e.target.ancestor("tr");

            if (!theTr._editor) {
                theTr._editor = true;
                tinyMCE.init({
                    "width": "100%",
                    "height": "100%",
                    "menubar": false,
                    "statusbar": false,
                    "toolbar": "bold italic | bullist numlist",
                    "selector": "tr[data-teamid='" + team.get("id") + "'] .infos-comments",
                    "setup": Y.bind(function(mce) {
                        var saveTimer,
                            context = this;
                        mce.on('init', function(args) {
                            context.editor = args.target;
                            if (context.team.get("notes")) {
                                context.editor.setContent(context.team.get("notes"));
                            } else {
                                context.editor.setContent("<i>Notes</i>");
                            }
                        });
                        mce.on('keyup', function() {
                            clearTimeout(saveTimer);
                            saveTimer = setTimeout(context.saveNotes, 500, context);
                        });
                    }, {
                        team: team,
                        saveNotes: this._saveNotes
                    })
                });
            }

            e.target.toggleClass("details__link__closed");
            e.target.toggleClass("details__link__opened");

            trDetails.toggleClass("team-details-closed");
            trDetails.toggleClass("team-details-opened");

            theTr.toggleClass("team-closed");
            theTr.toggleClass("team-opened");
        },
        _saveNotes: function(context) {
            context.team.set("notes", context.editor.getContent());
            Y.Wegas.Facade.Game.cache.put(context.team.toObject("players"), {
                cfg: {
                    updateEvent: false
                }
            });
        },
        _getPayloadFromEvent: function(e) {
            var datatable = Y.Widget.getByNode(e.target),
                tr,
                record,
                cell,
                column,
                team,
                value;

            tr = datatable.getRecord(e.target);
            if (tr) {
                record = tr.getAttrs();

                cell = datatable.getCell(e.target);
                //column = datatable.getColumn(e.target.getData()["action-id"]),
                column = datatable.getColumn(cell);

                team = record.team;
                value = record[column.key];
            } else {
                // global hit
                team = Y.Wegas.Facade.Game.cache.getCurrentGame();
                value = null;
                column = datatable.getColumn(e.target.getData("columnName"));
            }
            return {
                column: column,
                team: team,
                value: value
            };
        },
        actionClick: function(e) {
            var data = this._getPayloadFromEvent(e);
            data.column.do(data.team, data.value);
        },
        _loadRemoteData: function() {
            var dashboards = Y.namespace("Wegas.Config.Dashboards"), script;
            if (dashboards && this.get("name") && dashboards[this.get("name")]) {
                script = dashboards[this.get("name")];

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
                        success: Y.bind(function(e) {
                            var results = e.response.results,
                                i, j, item, key, label;

                            if (Y.Lang.isArray(results.structure)) {
                                this._monitoredData = {
                                    structure: {
                                        main: {
                                            def: {},
                                            title: ""
                                        }
                                    }, data: {
                                    }
                                };
                                for (i in results.structure) {
                                    if (results.structure[i].items) {
                                        if (results.structure[i].title) {
                                            label = results.structure[i].title;
                                            label = label.slice(0, 1).toUpperCase() + label.slice(1);
                                        }
                                        this._monitoredData.structure.main.def[results.structure[i].title] = {
                                            id: results.structure[i].title,
                                            label: label,
                                            itemType: "group",
                                            items: {}
                                        };
                                        for (j in  results.structure[i].items) {
                                            item = results.structure[i].items[j];
                                            this._monitoredData.structure.main.def[results.structure[i].title].items[item.id] = item;
                                        }
                                    }
                                }

                                for (key in results.data) {
                                    this._monitoredData.data[key] = {
                                        "main": results.data[key]
                                    };
                                }
                            } else {
                                this._monitoredData = results;
                            }
                            this.syncTable();

                        }, this),
                        failure: Y.bind(function(e) {
                            if (e.response && e.response.results && e.response.results.message) {
                                Y.Wegas.Alerts.showMessage("error", e.response.results.message);
                            } else {
                                Y.Wegas.Alerts.showMessage("error", "Something went wrong");
                            }
                            this._monitoredData = {};
                            this.syncTable();
                        }, this)
                    }
                });
            } else {
                this._monitoredData = {};
                this.syncTable();
            }
        },
        syncTable: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                that = this,
                tables = {}, data = {}, i, j, tableDef,
                teamId, team, teamData, entry,
                cell, cellDef,
                tableName, tableColumns, formatter, transformer,
                key1, key2, firstCellFormatter,
                firstOfGroup,
                getPlayerIcon,
                parseItem = function(id, def, firstOfGroup) {
                    var item = {
                        key: id,
                        label: def.label,
                        sortable: (def.sortable !== undefined ? def.sortable : false),
                        // Try to use column user defined tooltip or use defaut one otherwise
                        disabledTooltip: def.disabledTooltip || "This action is not yet active",
                        cssClass: (firstOfGroup ? "first-of-group" : "")
                    };

                    if (def.itemType === "action") {

                        if (def.hasGlobal) {
                            item.label = "<span data-columnName=\"" + id + "\" class=\"dashboard-action dashboard-global-action " + (firstOfGroup ? "first-of-group " : "") +
                                def.icon + " enabled\" title=\"Global " + def.label + "\"></span>";
                        } else {
                            item.label = " ";
                        }
                        item.title = def.label;

                        item.nodeFormatter = function(o) {
                            o.cell.setHTML("<span class=\"dashboard-action " +
                                o.column.icon + " " +
                                (o.value && o.value.disabled ? "disabled" : "enabled") +
                                "\" title=\"" + o.column.title + "\"></span>");

                            if (o.column.cssClass) {
                                o.cell.addClass(o.column.cssClass);
                            }

                            if (o.value && o.value.disabled) {
                                o.cell.plug(Y.Plugin.Tooltip, {
                                    // Try to use value specific tooltip, or use the fallback one otherwise
                                    content: o.value.disabledTooltip || o.column.disabledTooltip
                                });
                            }
                        };
                        item.icon = def.icon;
                        item.do = eval("(" + def.do + ")");
                        item.sortable = false;
                    } else {
                        if (def.formatter) {
                            formatter = eval("(" + def.formatter + ")");
                            if (formatter) {
                                item.valueFormatter = formatter;
                            }
                        }
                        if (def.transformer) {
                            transformer = eval("(" + def.transformer + ")");
                            if (transformer) {
                                item.valueTransformer = transformer;
                            }
                        }

                        item.nodeFormatter = function(o) {
                            if (o.column.cssClass) {
                                o.cell.addClass(o.column.cssClass);
                            }

                            var fallback = false;
                            if (def.kind) {
                                if (def.kind === "boolean") {
                                    o.cell.setHTML("<span class=\"bloc__value bloc__boolean\">" + (o.value ? "✔" : "✕") + "</span>");

                                    if (o.column.valueFormatter) {
                                        o.column.valueFormatter.call(this, o.cell, o.value);
                                    }

                                } else if (def.kind === "inbox") {
                                    o.cell.setHTML('<i class=\"bloc__text ' + (o.value.empty ? 'icon fa fa-comment-o"' : 'icon fa fa-commenting-o"') + ' title="Click to view"></i>');
                                } else if (def.kind === "text") {
                                    o.cell.setHTML('<i class=\"bloc__text ' + (o.value.empty ? 'icon fa fa-file-o"' : 'icon fa fa-file-text-o"') + ' title="Click to view"></i>');
                                } else {
                                    fallback = true;
                                }
                            } else {
                                fallback = true;
                            }

                            if (fallback) {
                                if (o.value !== undefined && o.value !== null) {
                                    if (o.column.valueTransformer) {
                                        o.value = o.column.valueTransformer.call(this, o.value);
                                    }
                                    o.cell.setHTML("<span class=\"bloc__value\">" + o.value + "</span>");
                                } else {
                                    o.cell.setHTML("<span class=\"bloc__value no-value\"></span>");
                                }

                                if (o.column.valueFormatter) {
                                    o.column.valueFormatter.call(this, o.cell, o.value);
                                }
                            }
                        };
                    }
                    return item;
                };

            if (Y.Object.isEmpty(this._monitoredData)) {
                Y.mix(this._monitoredData, {
                    "structure": {
                        "main": DEFAULT_TABLE_STRUCTURE
                    },
                    "data": {
                    }
                }, false, null, 0, true);
            } else {
                for (tableName in this._monitoredData.structure) {
                    Y.mix(this._monitoredData.structure[tableName], DEFAULT_TABLE_STRUCTURE, false, null, 0, true);
                }
            }

            getPlayerIcon = function(player) {
                if (player.get("status") === "LIVE") {
                    if (player.get("verifiedId")) {
                        return "<i class='verified fa fa-id-card-o' title=\"" + "✔ verified " + player.get("homeOrg").toUpperCase() + " member" + "\"></i>";
                    } else {
                        return "<i class='unverified fa fa-user' title=\"✘ Unverified identity\"></i>";
                    }
                } else {
                    return "<i class='erroneous fa fa-exclamation-triangle' title=\"Player failed to join\"></i>";
                }
            };

            firstCellFormatter = function(o) {
                var cell = o.cell,
                    team = o.record.get("team"),
                    teamList,
                    row = cell.ancestor(),
                    base = Y.Node.create(BASE_TEMPLATE),
                    icon = Y.Node.create("<span class='team-details__icon'></span>"),
                    details = Y.Node.create("<span class='team-details__content'></span>");

                if (!that._freeForAll) {
                    base.addClass("team-details--team");
                    //this.get("host").get("contentBox").addClass("card--team");
                    teamList = Y.Node.create(TEAM_LIST_TEMPLATE);

                    Y.Array.each(team.get("players"), function(player) {
                        var node = Y.Node.create("<li class='team-details__player'>" + getPlayerIcon(player) + "<span>" + player.get("name") + "</span></li>");
                        teamList.one(".team-details__players__list").append(node);
                    }, that);

                    base.prepend(teamList);
                    icon.setContent("<i class='fa fa-users'></i>");
                } else {
                    if (team.get("players")) {
                        icon.setContent(getPlayerIcon(team.get("players")[0]));
                    } else {
                        icon.setContent("<i class='fa fa-exclamation-triangle'></i>");
                    }
                }
                cell.append(icon);

                details.append(Y.Node.create(TITLE_TEMPLATE).setContent(o.record.get("team-name")));
                details.append(Y.Node.create(LINK_TEMPLATE));
                cell.append(details);

                row.insert(
                    '<tr class="team-details team-details-closed" data-teamid="' + team.get("id") + '">' +
                    '<td colspan="30">' + base.getContent() + ' </td>' +
                    '</tr>',
                    'after');
            };
            /**
             * Generate Table(s) structure
             */
            for (tableName in this._monitoredData.structure) {
                Y.log("PARSE TABLE " + tableName);
                tableDef = this._monitoredData.structure[tableName].def;
                // first cell il team/player info
                tableColumns = [{key: "team-name", label: (this._freeForAll ? "Player" : "Team"), nodeFormatter: firstCellFormatter, sortable: true}];
                //for (i = 0; i < tableDef.length; i++) {
                for (i in tableDef) {
                    cellDef = tableDef[i];
                    if (cellDef.itemType === "group") {
                        cell = {
                            label: cellDef.label,
                            children: []
                        };
                        firstOfGroup = true;
                        for (j in cellDef.items) {
                            cell.children.push(parseItem(j, cellDef.items[j], firstOfGroup));
                            firstOfGroup = false;
                        }
                    } else {
                        cell = parseItem(i, cellDef);
                    }
                    tableColumns.push(cell);
                }
                tables[tableName] = tableColumns;
            }
            if (Y.Object.isEmpty(this._monitoredData.data)) {
                // NO DATA PROVIDED -> include all team in all tables
                if (game) {
                    for (i = 0; i < game.get("teams").length; i++) {
                        team = game.get("teams")[i];
                        if ((game.get("@class") === "DebugGame" || team.get("@class") !== "DebugTeam") &&
                            team.get("players").length) {
                            for (tableName in this._monitoredData.structure) {
                                data[tableName] = data[tableName] || [];
                                entry = {"team-name": (this._freeForAll ? team.get("players")[0].get("name") : team.get("name")),
                                    "team-id": teamId, "team": team};
                                data[tableName].push(entry);
                            }
                        }
                    }
                }
            } else {
                // DATA PROVIDED BY REMOTE SCRIPT
                for (teamId in this._monitoredData.data) {
                    team = Y.Wegas.Facade.Game.cache.getTeamById(teamId);
                    teamData = this._monitoredData.data[teamId];
                    if ((game.get("@class") === "DebugGame" || team.get("@class") !== "DebugTeam") && team.get("players").length > 0) {
                        for (tableName in teamData) {
                            data[tableName] = data[tableName] || [];
                            entry = {"team-name": (this._freeForAll ? team.get("players")[0].get("name") : team.get("name")),
                                "team-id": teamId, "team": team};

                            for (cell in teamData[tableName]) {
                                entry[cell] = teamData[tableName][cell];
                            }
                            data[tableName].push(entry);
                        }
                    }
                }
            }

            for (tableName in this.datatables) {
                this.datatables[tableName].destroy();
            }

            this.destroyAll();
            this.addButtons();

            for (tableName in this._monitoredData.structure) {
                if (data[tableName]) {
                    this.datatables[tableName] = new Y.DataTable({columns: tables[tableName], data: data[tableName], sortBy: {"team-name": 'asc'}});
                    this.add(new Y.Wegas.DashboardDatatable({
                        title: this._monitoredData.structure[tableName].title,
                        datatable: this.datatables[tableName]
                    }));
                }
            }
        },
        onBooleanClick: function(event) {
            var data = this._getPayloadFromEvent(event),
                aPlayerId = data.team.getLivePlayer().get("id"),
                varName = data.column.key,
                value = data.value;

            event.target.addClass("loading");

            Y.Wegas.Facade.Variable.sendRequest({
                request: "/Script/Run/" + aPlayerId,
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        content: "Variable.find(gameModel, \"" + varName + "\").getInstance(self).setValue(" + !value + ");"
                    }
                },
                on: {
                    success: Y.bind(function(target) {
                        event.target.removeClass("loading");
                        this.syncUI();
                    }, this, event.target),
                    failure: Y.bind(function(target) {
                        event.target.removeClass("loading");
                        this.syncUI();
                    }, this, event.targer)
                }
            });
        },

        _getValueFromEvent: function(e) {
            return this._getPayloadFromEvent(e).value;
        },
        onTextClick: function(event) {
            var v;
            if (this.detailsOverlay.get("visible")) {
                this.detailsOverlay.hide();
            }
            if (event.currentTarget !== this.detailsTarget) {
                v = this._getValueFromEvent(event);
                this._display(v.title, v.body);
                this.detailsTarget = event.currentTarget;
            } else {
                this.detailsTarget = null;
            }
            event.halt(true);
        },
        _display: function(title, body) {
            var pdfLink = Y.Wegas.app.get("base") + "print.html",
                titleBar = '<div class="title">' + title + '</div><div class="fa fa-close closeIcon" title="Close window"></div><div class="saveIcon wegas-icon-pdf" title="Download PDF"></div>';
            this.detailsOverlay.set("headerContent", titleBar);
            this.detailsOverlay.get("contentBox").one(".saveIcon").on("click", function(event) {
                event.halt(true);
                var t = this.toEntities(title),
                    h = "<h2>" + t + "</h2>" + "<hr />" + this.toEntities(body);
                this.post(pdfLink, {"title": t, "body": h, "outputType": "pdf"});
            }, this);
            this.detailsOverlay.setStdModContent('body', body);
            // Prevent text selection attempts from closing the window:
            this.detailsOverlay.get("contentBox").on("click", function(event) {
                if (! event.target.hasClass("closeIcon")) {
                    event.halt(true);
                }
            }, this);
            this.detailsOverlay.set("centered", true);
            this.detailsOverlay.show();
        },
        closeDetails: function(event) {
            event && event.halt(true);
            this.detailsOverlay.hide();
            this.detailsTarget = null;
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
    }, {
        EDITORNAME: "Dashboard (datatable)",
        ATTRS: {
            "name": {
                type: "string",
                value: null
            }
        }
    });
});
