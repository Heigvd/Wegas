/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * Wegas Dashboard - V3
 * @author Maxence Laurent
 */
YUI.add('wegas-dashboard', function(Y) {
    "use strict";

    var TITLE_TEMPLATE = "<span class='team-name'></span>",
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
                            "id": "impacts",
                            "order": 0,
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
                        sendmail_irl: {
                            "id": "sendmail_irl",
                            "order": 0,
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
                            "id": "view",
                            "order": 999,
                            "icon": "info-view",
                            "itemType": "action",
                            "label": "View playing session",
                            "hasGlobal": false,
                            "do": function(team, payload) {
                                var p = team.getLivePlayer();
                                if (p) {
                                    window.open("game-lock.html?id=" + p.get("id"), "_blank");
                                } else {
                                    Y.Wegas.Alerts.showMessage("error", "No valid player in team");
                                }
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
            var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                gmProps = gm.get("properties");
            this._freeForAll = gmProps.get("val").freeForAll;
            this.logId = gmProps.get("val").logID;

            this.datatables = {};

            this.detailsOverlay = new Y.Overlay({
                zIndex: 100,
                width: this.get("width"),
                constrain: true,
                visible: false
            }).render();

            this.detailsOverlay.get("contentBox").addClass("wegas-dashboard-monitor--popup-overlay");
            this.detailsTarget = null;

            // Use scenario name as name space for these preferences:
            this.clientPrefs = "wegas-dashboard-" + gm.get("name").replace(/\s+/g, '');
            var cfg = localStorage.getItem(this.clientPrefs) || {};
            if (typeof cfg === "string") {
                try {
                    cfg = JSON.parse(cfg);
                } catch (e) {
                    cfg = {};
                }
            }

            this.preferences = {
                main: {
                    monitoring: cfg
                },
            };
        },
        getDefaultTableStructure: function() {
//            if (this.logId) {
//                var struct = Y.mix({}, DEFAULT_TABLE_STRUCTURE);
//                struct.def.actions.items.stats = {
//                    "id": "stats",
//                    "order": -1,
//                    "icon": "fa fa-pie-chart",
//                    "itemType": "action",
//                    "label": "Download statistics (Excel file)",
//                    "hasGlobal": true,
//                    "globalOnly": "Not available per team. Please use global export",
//                    "do": function(owner, payload) {
//                        var logId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties")
//                            .get("val").logID;
//                        var path = owner.name === "Game" || owner.name === "DebugGame" ? "Games" : "Teams";
//                        window.open("rest/Statistics/ExportXLSX/" + logId
//                            + "/" + path + "/" + owner.get("id"), "_blank");
//                    }
//                };
//                return struct;
//            } else {
            return DEFAULT_TABLE_STRUCTURE;
//            }
        },
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
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                teams = game.get("teams");

            this.toolbar = new Y.Wegas.FlexList({
                direction: "horizontal",
                cssClass: 'dashboard-toolbar'
            });

            this.add(this.toolbar);

            if (teams.length === 0 || teams.length === 1 && teams[0].get("@class") === "DebugTeam") {
                this.toolbar.add(new Y.Wegas.Text({
                    content: "No players have joined yet"
                }));
            }


            /*
             if (this.logId) {
             this.toolbar.add(new Y.Wegas.Text({
             content: '<a title="Download statistics (Excel)" href="rest/Statistics/ExportXLSX/'
             + this.logId + '/Games/' + +game.get('id') + '" '
             + 'target="_blank"><span class="fa fa-2x fa-pie-chart"></span></a>',
             cssClass: 'download-stats global-button'
             }));
             }*/

            this.toolbar.add(new Y.Wegas.Text({
                content: '<a title="Download overview (Excel)" href="rest/GameModel/Game/'
                    + game.get('id')
                    + '/ExportMembers.xlsx" target="_blank"><span class="fa fa-2x fa-file-excel-o"></span></a>',
                cssClass: 'download-members global-button'
            }));

            this.toolbar.add(new Y.Wegas.Text({
                content: '<i class="fa fa-2x fa-refresh"></i>',
                cssClass: 'refreshButton global-button',
                on: {
                    click: Y.bind(function() {
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

            this.get("contentBox").delegate("click", this.onBooleanClick, ".bloc__boolean.toggleable", this);
            this.get("contentBox").delegate("click", this.onTextClick, ".bloc__text.clickable", this);

            this.get("contentBox").delegate("click", this.onCustomizeGroupClick, ".customize-group", this);

            Y.Wegas.app.once('ready', Y.bind(this.syncUI, this));
            Y.on("dashboard:refresh", Y.bind(this.syncUI, this));

            this.handlers.onBodyClick = Y.one("body").on("click", Y.bind(function(event) {
                this.closeDetails();
            }, this), this.detailsOverlay);
        },
        syncUI: function() {
            //BB.addClass("loading");
            this.get("contentBox").one(".refreshButton i").addClass(" fa-pulse");

            // reload game to have editor view
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame();

            Y.Wegas.Facade.Game.sendRequest({
                request: "/" + game.get("id"),
                on: {
                    success: Y.bind(function(e) {
                        this._loadRemoteData();
                    }, this)
                }
            });
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
                                        var currGroup = {
                                            id: results.structure[i].title,
                                            label: label,
                                            itemType: "group",
                                            items: {},
                                            customizable: false
                                        },
                                            prefs = this.preferences.main[results.structure[i].title] || {};
                                        for (j in results.structure[i].items) {
                                            item = results.structure[i].items[j];
                                            currGroup.items[item.id] = item;
                                            var isActive = prefs[item.id] ? prefs[item.id].active : item.active;
                                            prefs[item.id] = {
                                                id: item.id,
                                                label: item.label || item.id,
                                                active: isActive
                                            };

                                            // Until we make this option a standard, only show its icon when at least one column is inactive:
                                            if ((item.active === false || isActive === false) && !currGroup.customizable) {
                                                currGroup.customizable = true;
                                                currGroup.label = '<span class="customize-group" data-group="' + currGroup.id + '" title="Customize columns">' + currGroup.label + '</span>';
                                            }
                                        }
                                        this._monitoredData.structure.main.def[results.structure[i].title] = currGroup;
                                        this.preferences.main[results.structure[i].title] = prefs;
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
        completePreferences: function() {
            if (this.preferencesInitialized) {
                return;
            }
            var prefs = this.preferences,
                structure = this._monitoredData.structure;
            for (var tableName in structure) {
                if (!prefs[tableName]) {
                    prefs[tableName] = {};
                }
                var tablePrefs = prefs[tableName],
                    tableDefs = structure[tableName].def;
                for (var groupName in tableDefs) {
                    if (!tablePrefs[groupName]) {
                        tablePrefs[groupName] = {};
                    }
                    var groupPrefs = tablePrefs[groupName],
                        groupDefs = tableDefs[groupName];
                    for (var colName in groupDefs.items) {
                        var itemPrefs = groupPrefs[colName];
                        if (itemPrefs === undefined) {
                            itemPrefs = {
                                active: true
                            };
                            groupPrefs[colName] = itemPrefs;
                        } else if (itemPrefs.active === undefined) {
                            itemPrefs.active = true;
                        }
                    }
                }
            }
            this.preferencesInitialized = true;
        },

        syncTable: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                that = this,
                tables = {}, data = {}, i, j, tableDef,
                teamId, team, teamData, entry,
                cell, cellDef,
                tableName, tableColumns,
                firstCellFormatter,
                firstOfGroup,
                getPlayerIcon,
                parseItem = function(id, def, firstOfGroup) {
                    var item = {
                        key: id,
                        label: def.label,
                        sortable: (def.sortable !== undefined ? def.sortable : false),
                        sortFn: def.sortFn,
                        // Try to use column user defined tooltip or use defaut one otherwise
                        disabledTooltip: def.disabledTooltip || "This action is not yet active",
                        cssClass: (firstOfGroup ? "first-of-group" : "")
                    };
                    var formatter;
                    var sortFn;

                    if (def.itemType === "action") {

                        if (def.hasGlobal) {
                            item.label = "<span data-columnName=\"" + id + "\" class=\"dashboard-action dashboard-global-action " + (firstOfGroup ? "first-of-group " : "") +
                                def.icon + " enabled\" title=\"Global " + def.label + "\"></span>";
                        } else {
                            item.label = " ";
                        }
                        item.title = def.label;

                        item.nodeFormatter = function(o) {
                            var tooltip = o.column.title;
                            if (o.column.globalOnly && typeof o.column.globalOnly === "string") {
                                tooltip = o.column.globalOnly;
                            }
                            o.cell.setHTML("<span class=\"dashboard-action " +
                                o.column.icon + " " +
                                (o.column.globalOnly || (o.value && o.value.disabled) ? "disabled" : "enabled") +
                                "\" title=\"" + tooltip + "\"></span>");

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

                        item.do = W.Sandbox.eval("return (" + def.do+ ")");

                        item.sortable = false;
                        item.globalOnly = def.globalOnly;
                    } else {
                        if (def.formatter) {
                            formatter = W.Sandbox.eval("return (" + def.formatter + ")");
                            if (formatter) {
                                item.valueFormatter = function(bloc, value) {
                                    var node = W.Sandbox.proxyNode(bloc);
                                    formatter(node, value);
                                };
                            }
                        }
                        if (def.sortFn) {
                            sortFn = W.Sandbox.eval("return (" + def.sortFn + ")");
                            if (sortFn) {
                                item.sortFn = function(a, b, desc) {
                                    // intercept sort function and provide data
                                    return sortFn(a.get(id), b.get(id), desc);
                                };
                            }
                        }

                        item.nodeFormatter = function(o) {
                            if (o.column.cssClass) {
                                o.cell.addClass(o.column.cssClass);
                            }

                            var fallback = false;
                            if (def.kind) {
                                if (def.kind === "boolean") {
                                    if (def.preventClick) {
                                        o.cell.setHTML("<span class=\"bloc__value bloc__boolean\">" + (o.value ? "✔" : "✕") + "</span>");
                                    } else {
                                        o.cell.setHTML("<span class=\"bloc__value bloc__boolean toggleable\">" + (o.value ? "✔" : "✕") + "</span>");
                                    }

                                    if (o.column.valueFormatter) {
                                        o.column.valueFormatter.call(this, o.cell, o.value);
                                    }

                                } else if (def.kind === "inbox") {
                                    o.cell.setHTML('<i class="bloc__text clickable ' + (o.value.empty ? 'icon fa fa-comment-o"' : 'icon fa fa-commenting-o"') + ' title="Click to view"></i>');
                                } else if (def.kind === "text") {
                                    o.cell.setHTML('<i class="bloc__text clickable ' + (o.value.empty ? 'icon fa fa-file-o"' : 'icon fa fa-file-text-o"') + ' title="Click to view"></i>');
                                } else {
                                    fallback = true;
                                }
                            } else {
                                fallback = true;
                            }

                            if (fallback) {
                                if (o.value !== undefined && o.value !== null) {
                                    o.cell.setHTML("<span class=\"bloc__value\">" + o.value + "</span>");
                                } else {
                                    o.cell.setHTML("<span class=\"bloc__value no-value\"></span>");
                                }
                            }

                            if (o.column.valueFormatter) {
                                o.column.valueFormatter.call(this, o.cell, o.value);
                            }
                        };
                    }
                    return item;
                };

            if (Y.Object.isEmpty(this._monitoredData)) {
                Y.mix(this._monitoredData, {
                    "structure": {
                        "main": this.getDefaultTableStructure()
                    },
                    "data": {
                    }
                }, false, null, 0, true);
            } else {
                for (tableName in this._monitoredData.structure) {
                    Y.mix(this._monitoredData.structure[tableName], this.getDefaultTableStructure(), false, null, 0, true);
                }
            }
            this.completePreferences();

            getPlayerIcon = function(player) {
                if (player.get("status") === "LIVE") {
                    if (player.get("verifiedId")) {
                        return "<i class='verified fa fa-id-card-o' title=\"" + "✔ verified " + player.get("homeOrg")
                            .toUpperCase() + " member" + "\"></i>";
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
                    var tabPrefs = this.preferences[tableName],
                        groupPrefs = tabPrefs && tabPrefs[i],
                        cellDef = tableDef[i];
                    if (cellDef.itemType === "group") {
                        cell = {
                            label: cellDef.label,
                            children: []
                        };
                        firstOfGroup = true;
                        var children = Y.Object.values(cellDef.items).sort(function(a, b) {
                            return a.order - b.order;
                        });
                        for (j in children) {
                            var child = children[j];
                            var id = child.id;
                            var itemPrefs = groupPrefs && groupPrefs[id];
                            if (itemPrefs && itemPrefs.active !== false) {
                                cell.children.push(parseItem(id, child, firstOfGroup));
                                firstOfGroup = false;
                            }
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
        onCustomizationClick: function(event) {
            var target = event.currentTarget,
                group = target.getData("group"),
                cbx = target.getData("cbx"),
                items = this.preferences.main[group],
                empty = true,
                storedPrefs = {};

            items[cbx].active = !(items[cbx].active);
            for (var item in items) {
                storedPrefs[item] = {active: items[item].active};
                // Don't allow empty monitoring groups ...
                if (items[item].active) {
                    empty = false;
                }
            }
            if (empty) {
                items[cbx].active = !(items[cbx].active);
                alert("Sorry, at least one option has to be active.");
            } else {
                if (items[cbx].active) {
                    target.addClass("selected");
                } else {
                    target.removeClass("selected");
                }
                // Update localStorage:
                localStorage.setItem(this.clientPrefs, JSON.stringify(storedPrefs));
            }
            event.halt(true);
        },
        onCustomizeGroupClick: function(event) {
            var group = event.currentTarget.getData("group"),
                items = this.preferences.main[group],
                title = "Monitored variables/columns",
                body = '';
            if (this.detailsOverlay.get("visible")) {
                this.detailsOverlay.hide();
            }
            if (event.currentTarget !== this.detailsTarget) {
                body = '<div class="customize-group-window">';
                for (var j in items) {
                    if (items[j].label) {
                        body += '<div class="checkbox' + (items[j].active ? ' selected' : '') + '" data-group="' + group + '" data-cbx="' + items[j].id + '">' + items[j].label + "</div>";
                    }
                }
                body += '<button class="customize-group-submit-button">OK</button></div>';
                this._display(title, body, true, Y.bind(function() {
                    this.syncUI();
                }, this));
                this.detailsTarget = event.currentTarget;
                this.detailsOverlay.bodyNode.delegate("click", this.onCustomizationClick, ".checkbox", this);
                this.detailsOverlay.bodyNode.delegate("click", this.closeDetails, ".customize-group-submit-button", this);
            } else {
                this.detailsTarget = null;
            }
            event.halt(true);
        },
        _display: function(title, body, hidePdfButton, onClose) {
            var pdfLink = Y.Wegas.app.get("base") + "print.html",
                titleBar = '<div class="title">' + title + '</div><div class="fa fa-close closeIcon" title="Close window"></div>',
                showPdfButton = !(hidePdfButton === true);
            if (showPdfButton) {
                titleBar += '<div class="saveIcon wegas-icon-pdf" title="Download PDF"></div>';
            }
            this.detailsOverlay.set("headerContent", titleBar);
            if (showPdfButton) {
                this.detailsOverlay.get("contentBox").one(".saveIcon").on("click", function(event) {
                    event.halt(true);
                    var t = this.toEntities(title),
                        h = "<h2>" + t + "</h2>" + "<hr />" + this.toEntities(body);
                    this.post(pdfLink, {"title": t, "body": h, "outputType": "pdf"});
                }, this);
            }
            this.detailsOverlay.setStdModContent('body', body);
            // Prevent text selection attempts from closing the window:
            this.detailsOverlay.get("contentBox").on("click", function(event) {
                if (!event.target.hasClass("closeIcon")) {
                    event.halt(true);
                }
            }, this);
            this.detailsOverlay.set("centered", true);
            this.detailsOverlay.show();
            this.detailsOverlay.set("onClose", onClose);
        },
        closeDetails: function(event) {
            if (this.detailsOverlay.get("visible")) {
                event && event.halt(true);
                this.detailsOverlay.hide();
                this.detailsTarget = null;
                this.detailsOverlay.get("onClose") && this.detailsOverlay.get("onClose")();
            }
        },
        /*
         ** Opens a new tab where the given data is posted:
         */
        post: function(url, postData) {
            //var tabWindowId = window.open('about:blank', '_blank');
            //tabWindowId.document.title = postData.title;
            var form = window.document.createElement("form");
            //form.setAttribute("style", 'display: none;');
            form.setAttribute("method", "post");
            form.setAttribute("action", url);
            form.setAttribute("target", "_blank");

            for (var key in postData) {
                if (postData.hasOwnProperty(key)) {
                    var hiddenField = window.document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", postData[key]);
                    form.appendChild(hiddenField);
                }
            }
            // var btn = tabWindowId.document.createElement("button"); btn.appendChild(tabWindowId.document.createTextNode("SUBMIT")); form.appendChild(btn);
            window.document.body.appendChild(form);
            form.submit();
            form.remove();
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
