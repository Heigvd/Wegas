/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2016 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Wegas Dashboard - V3
 * @author Maxence Laurent 
 */
YUI.add('wegas-dashboard2', function(Y) {
    "use strict";

    var DEFAULT_TABLE_STRUCTURE,
        TITLE_TEMPLATE = "<span class='team-name'></span>",
        LINK_TEMPLATE = "<span class='details__link details__link__closed'>Details</span>",
        BASE_TEMPLATE = "<div><div class='team-details__notes'><textarea class='infos-comments' placeholder='Enter a comment here'></textarea></div>" + "</div>",
        TEAM_LIST_TEMPLATE = "<div class='team-details__players'>" + "<h3>Players</h3>" + "<ul class='team-details__players__list'></ul>" + "</div>",
        PLAYER_TEMPLATE = "<li class='team-details__player'></li>",
        DEFAULT_TABLE_STRUCTURE = {
            title: "",
            def: {
                actions: {
                    "id": "actions",
                    "label": "Actions",
                    "itemType": "group",
                    "items": {
                        impacts: {
                            "icon": "action-impacts",
                            "itemType": "action",
                            "label": "Impacts",
                            "do": function(team, payload) {
                                new Y.Wegas.ImpactsTeamModal({
                                    "team": team
                                }).render();
                            }
                        },
                        sendmail: {
                            "icon": "action-email",
                            "itemType": "action",
                            "label": "Send real E-Mail",
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
                            "do": function(team, payload) {
                                window.open("game-lock.html?id=" + team.get("players")[0].get("id"), "_blank");
                            }
                        }
                    }
                }
            }
        };

    Y.Wegas.DashboardDatatable = Y.Base.create("wegas-dashboard2", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class='dashboard-table-title'></div>" +
            "<div class='dashboard-table-data'></div>" +
            "</dib>",
        initializer: function() {
            this.dt = this.get("datatable");
        },
        renderUI: function() {
            var title = this.get("title");
            if (title) {
                this.get("contentBox").one(".dashboard-table-title").setContent(title);
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



    Y.Wegas.Dashboard2 = Y.Base.create("wegas-dashboard2", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class='dashboard'></div>",
        initializer: function() {
            this.handlers = {};
            this._freeForAll = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll");

            this.datatables = {};

            /*
             this.detailsOverlay = new Y.Overlay({
             zIndex: 100,
             width: this.get("width"),
             constrain: true,
             visible: false
             });
             
             this.detailsOverlay.get("contentBox").addClass("wegas-dashboard--popup-overlay");*/
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
            if (this.toolbar) {
                this.toolbar.removeAll();
                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span> Refresh',
                    on: {
                        click: Y.bind(function(event) {
                            this.syncUI();
                        }, this)
                    }
                }));
            }
        },
        bindUI: function() {
            //this.handlers.push(Y.Wegas.Facade.Game.after("update", this.phenixize, this));
            this.get("contentBox").delegate("click", this.actionClick, ".dashboard-action", this);
            this.get("contentBox").delegate("click", this.detailsClick, ".details__link", this);
        },
        syncUI: function() {
            var BB = this.get("boundingBox");
            //BB.addClass("loading");
            this._loadRemoteData();
        },
        detailsClick: function(e) {
            var datatable = Y.Widget.getByNode(e.target),
                record = datatable.getRecord(e.target).getAttrs(),
                team = record.team,
                cell = datatable.getCell(e.target),
                trDetails = datatable.get("contentBox").one("tr[data-teamid='" + team.get("id") + "'");

            e.target.toggleClass("details__link__closed");
            e.target.toggleClass("details__link__opened");

            trDetails.toggleClass("team-details-closed");
            trDetails.toggleClass("team-details-opened");
        },
        actionClick: function(e) {
            var datatable = Y.Widget.getByNode(e.target),
                record = datatable.getRecord(e.target).getAttrs(),
                cell = datatable.getCell(e.target),
                //column = datatable.getColumn(e.target.getData()["action-id"]),
                column = datatable.getColumn(cell),
                team = record.team,
                value = record[column.key];
            column.do(team, value);
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
                            this._monitoredData = e.response.results;
                            this.syncTable();
                        }, this),
                        failure: Y.bind(function(e) {
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
                tableName, tableColumns, formatter,
                key1, key2, firstCellFormatter,
                parseItem = function(id, def) {
                    var item = {
                        key: id,
                        label: def.label,
                        formatter: eval("(" + def.formatter + ")"),
                        nodeFormatter: eval("(" + def.nodeFormatter + ")"),
                        sortable: true
                    };
                    formatter = eval("(" + def.nodeFormatter + ")");
                    if (formatter) {
                        item.nodeFormatter = formatter
                    } else {
                        formatter = eval("(" + def.formatter + ")");
                        if (formatter) {
                            item.formatter = formatter
                        }
                    }
                    if (def.itemType === "action") {
                        item.label = " ";
                        item.formatter = "<span class=\"dashboard-action " + def.icon + "\" title=\"" + def.label + "\"></span>";
                        item.icon = def.icon;
                        item.do = eval("(" + def.do + ")");
                        item.sortable = false;
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


            firstCellFormatter = function(o) {
                var cell = o.cell,
                    team = o.record.get("team"),
                    teamList,
                    row = cell.ancestor(),
                    base = Y.Node.create(BASE_TEMPLATE);

                if (!that._freeForAll) {
                    base.addClass("team-details--team");
                    //this.get("host").get("contentBox").addClass("card--team");
                    teamList = Y.Node.create(TEAM_LIST_TEMPLATE);
                    Y.Array.each(team.get("players"), function(player) {
                        player = Y.Node.create(PLAYER_TEMPLATE).append(player.get("name"));
                        teamList.one(".team-details__players__list").append(player);
                    }, that);
                    base.prepend(teamList);
                }
                cell.append(Y.Node.create(TITLE_TEMPLATE).setContent(o.record.get("team-name")));
                cell.append(Y.Node.create(LINK_TEMPLATE));
                row.insert(
                    '<tr class="team-details team-details-closed" data-teamid="' + team.get("id") + '">' +
                    '<td colspan="3">' + base.getContent() + ' </td>' +
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
                        for (j in cellDef.items) {
                            cell.children.push(parseItem(j, cellDef.items[j]));
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

            for (tableName in this._monitoredData.structure) {
                if (data[tableName]) {
                    this.datatables[tableName] = new Y.DataTable({columns: tables[tableName], data: data[tableName]});
                    this.add(new Y.Wegas.DashboardDatatable({
                        title: this._monitoredData.structure[tableName].title,
                        datatable: this.datatables[tableName]
                    }));
                }
            }
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
