/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-dashboard', function(Y) {
    "use strict";
    /**
     * @name Y.Wegas.Dashboard
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class class for join a team
     * @constructor
     */
    var CONTENTBOX = "contentBox", NAME = "name", Wegas = Y.Wegas, Dashboard, inSync = false,
        Promise = Y.Promise,
        teamTemplate = (new Y.Template()).compile(
            "<div class='dashboard-treeview dashboard-collapsed'><span class='wegas-icon dashboard-toggle'></span><span class='wegas-icon wegas-icon-team'></span><%= this.get('name') %>" +
            "<ul><% Y.Array.each(this.get('players'), function(p){ %>" +
            "<li><span class='wegas-icon wegas-icon-player'></span><%= p.get('name') %></li>" +
            "<%});%></ul></div>"
        ),
        setTableData = function(table, data) {
            var result;
            while (data.length) {
                result = data.shift();
                if (table.getRecord(result.id)) {
                    table.getRecord(result.id).setAttrs(result);
                }
            }
        },
        getTeams = function() {
            return new Promise(function(resolve, reject) {
                Y.Wegas.Facade.Game.cache.sendRequest({
                    request: "/" + Wegas.Facade.Game.cache.getCurrentGame().get("id") + "/Team",
                    on: {
                        success: function(e) {
                            resolve(e.response.entities);
                        },
                        failure: function(e) {
                            reject(e);
                        }
                    }
                });
            });
        },
        getData = function(script) {
            // var script = this.get("remoteScript");
            if (script) {
                return new Promise(function(resolve, reject) {
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/Script/Run/" + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id"),
                        cfg: {
                            method: "POST",
                            headers: {"Managed-Mode": false},
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
                return Promise.resolve([]);
            }
        };

    Dashboard = Y.Base.create("wegas-dashboard", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Private fields *** //
        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx library is used
         */
        renderUI: function() {
            var cfg = this.get("tableCfg");
            if (this.get("remoteScript") && this.toolbar) {
                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span>Refresh',
                    on: {
                        click: Y.bind(function() {
                            if (inSync) {
                                return;
                            }
                            inSync = true;
                            var bgenData = Y.bind(this.genData, this, this.table);
                            Promise.all([
                                getTeams()
                                    .then(function(teams) {
                                        return bgenData(teams);
                                    }),
                                getData(this.get("remoteScript"))
                            ])
                                .then(function(res) {
                                    setTableData(res[0], res[1]);
                                    inSync = false;
                                    return true;
                                })
                                .catch(function(error) {
                                    Y.log(error, "error", "Y.Wegas.Dashboard");
                                    inSync = false;
                                });
                        }, this)
                    }
                }));
            }
            this.get(CONTENTBOX).addClass("yui3-skin-wegas");
            if (!Y.Array.find(cfg.columns, function(i) {
                    return i.key === NAME;
                })) {
                cfg.columns.splice(0, 0, {
                    key: NAME,
                    label: " "
                });
            }
            cfg.columns = Y.Array.map(cfg.columns, function(c) {                // Add some default properties to columns
                return Y.mix(c, {
                    allowHTML: true,
                    sortable: false,
                    key: c.label,
                    emptyCellValue: "-"
                });
            });
            cfg = Y.mix(cfg, {
                sortBy: {name: "asc"}
            });
            //cfg = Y.mix(cfg, {//                                                // Add cfg default values
            //    width: "100%"
            //});
            this.table = new Y.DataTable(cfg)                                   // Render data table
                .render(this.get(CONTENTBOX))
                .set('strings.emptyMessage', "<em><center><br /><br />No players</center></em>");
            this.table.addColumn({
                key: "menu",
                label: " ",
                cellTemplate: "<td class='{className}'>" +
                              "<button class='yui3-button dashboard-open-team' title='View'><span class='fa fa-eye fa-lg'></span></button>" +
                              "<button class='yui3-button dashboard-impact-team' title='Impact'><span class='fa fa-play-circle-o fa-lg'></span></button>" +
                              "<button class='yui3-button dashboard-mail-team' title='Impact'><span class='fa fa-envelope-o fa-lg'></span></button>" +
                              "<textarea class='dashboard-notes-team disabled' placeholder='Notes' readonly='true'>{content}</textarea></td>"
            });
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            //            this.updateHandler =
            //                Wegas.Facade.Variable.after("update", this.syncUI, this);       // Listen updates on the
            // target datasource
            this.get("boundingBox").delegate("click", function(e) {
                var team = Wegas.Facade.Game.cache.getTeamById(this.table.getRecord(e.currentTarget).get("id")), header, statusNode = Y.Node.create("<span></span>");
                if (team && team.get("players").length) {
                    header = "<span>" + team.get("name") + " - " + team.get("players")[0].get("name") + "</span><br>";
                    new Y.Wegas.Panel({
                        modal: true,
                        children: [{
                            type: "CustomConsole",
                            player: team.get("players")[0],
                            statusNode: statusNode
                        }],
                        headerContent: header,
                        footerContent: statusNode,
                        width: 600,
                        /*height: 600,*/
                        zIndex: 5000,
                        buttons: {
                            header: [{
                                name: "src",
                                label: "View src",
                                classNames: "wegas-advanced-feature",
                                action: function() {
                                    this.item(0).viewSrc();
                                }
                            }],
                            footer: [{
                                name: "run",
                                label: "Impact !",
                                action: function() {
                                    this.item(0).run();
                                }
                            }, {
                                name: 'proceed',
                                label: 'Close',
                                action: "exit"
                            }, {
                                name: "add",
                                label: "Add impact",
                                action: function() {
                                    this.item(0).add();
                                }
                            }]
                        },
                    }).render().get("boundingBox").addClass("dashboard-impact-panel").addClass("dashboard-panel");
                } else {
                    this.showMessage("info", "Could not find a player");
                }

            }, ".yui3-datatable-col-menu .dashboard-impact-team", this);

            //            this.updateHandler =
            //                Wegas.Facade.Variable.after("update", this.syncUI, this);       // Listen updates on the
            // target datasource
            this.get("boundingBox").delegate("click", function(e) {
                var team = Wegas.Facade.Game.cache.getTeamById(this.table.getRecord(e.currentTarget).get("id")),
                    i, header, statusNode = Y.Node.create("<span></span>");
                if (team && team.get("players").length) {
                    header = "<span>Send E-Mail to team \"" + team.get("name") + "\" (";
                    for (i = team.get("players").length - 1; i >= 0; i -= 1) {
                        header += team.get("players")[i].get("name");
                        if (i > 0) {
                            header += ", ";
                        }
                    }
                    header += ")</span>";
                    new Y.Wegas.Panel({
                        cssClass: "wegas-form-panel",
                        modal: true,
                        children: [{
                            type: "SendMail",
                            players: team.get("players"),
                            statusNode: statusNode
                        }],
                        headerContent: header,
                        footerContent: statusNode,
                        width: 600,
                        zIndex: 5000,
                        buttons: {
                            header: [],
                            footer: [{
                                name: 'cancel',
                                label: 'Cancel',
                                action: "exit"
                            }, {
                                name: "send",
                                label: "Send",
                                action: function() {
                                    this.item(0).send();
                                }
                            }]
                        },
                        on: {
                            "email:sent": function() {
                                this.exit();
                            }
                        }
                    }).render().get("boundingBox").addClass("dashboard-mail-panel").addClass("dashboard-panel");
                } else {
                    this.showMessage("info", "Could not find a player");
                }

            }, ".yui3-datatable-col-menu .dashboard-mail-team", this);

            this.get("boundingBox").delegate("click", function(e) {
                var team = Wegas.Facade.Game.cache.getTeamById(this.table.getRecord(e.currentTarget).get("id"));
                if (team && team.get("players").length) {
                    window.open("game-lock.html?id=" + team.get("players")[0].get("id"));
                } else {
                    this.showMessage("info", "Could not find a player");
                }
            }, ".yui3-datatable-col-menu .dashboard-open-team", this);
            this.get("boundingBox").delegate("click", function(e) {
                e.currentTarget.toggleClass("dashboard-collapsed");
            }, ".yui3-datatable-col-name .dashboard-treeview");
            this.bindTextarea();
        },
        bindTextarea: function() {
            this.get("boundingBox").delegate("focus", function(e) {
                e.currentTarget.removeClass("disabled").addClass("enabled").removeAttribute("readonly");
            }, ".yui3-datatable-col-menu textarea.disabled");
            this.get("boundingBox").delegate("blur", function(e) {
                var team = Wegas.Facade.Game.cache.getTeamById(this.table.getRecord(e.currentTarget).get("id")), value = e.currentTarget.get("value");
                e.currentTarget.removeClass("enabled").addClass("disabled").setAttribute("readonly", true);
                if (team.get("notes") !== value) {
                    team.set("notes", value);
                    Y.Wegas.Facade.Game.cache.put(team.toObject("players"), {});
                }
            }, ".yui3-datatable-col-menu textarea.enabled", this);
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            var table = this.table;
            Y.log("sync()", "info", "Wegas.LobbyDataTable");
            inSync = true;
            this.genData(table, Wegas.Facade.Game.cache.getCurrentGame().get("teams"));
            getData(this.get("remoteScript"))
                .then(function(res) {
                    inSync = false;
                    return setTableData(table, res);
                });
        },
        destructor: function() {
            this.table.destroy();
            this.updateHandler.detach();
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         */
        genData: function(table, teams) {
            var gameModel = Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                columnsCfg = this.get("tableCfg.columns"), ret = [], result;

            if (gameModel.get("properties.freeForAll")) {                       // Retrieve the list of rows (depending on freeforall mode)
                Y.Array.each(teams, function(t) {
                    Y.Array.each(t.get("players"), function(p) {
                        ret.push({
                            name: "<span class='wegas-icon wegas-icon-player'></span>" + p.get("name"),
                            team: t,
                            player: p,
                            id: t.get("id"),
                            menu: t.get("notes")
                        });
                    });
                });
            } else {
                ret = Y.Array.map(teams, function(t) {
                    return {
                        //icon: "<span class='wegas-icon wegas-icon-team'></span>",
                        name: teamTemplate(t),
                        team: t,
                        player: t.get("players").length > 0 ? t.get("players")[0] : null,
                        id: t.get("id"),
                        menu: t.get("notes")
                    };
                });
            }
            ret = Y.Array.filter(ret, function(i) {                             // Filter debug team (for game edition)
                return !(i.team instanceof Wegas.persistence.DebugTeam);
            });
            table.set("data", ret);

            return table;
        }
    }, {
        ATTRS: {
            tableCfg: {
                value: {
                    columns: []
                },
                getter: function(v) {
                    var clone = Y.clone(v), dashboard = Y.namespace("Wegas.Config.Dashboard"),
                        cols = Y.Lang.isFunction(dashboard) ? dashboard().columns : dashboard.columns;
                    clone.columns = clone.columns.concat(cols);
                    return clone;
                }
            },
            /**
             * server script to get table data.
             * format: [{id:TEAMID[, TABLE_KEY:VALUE]*}*]
             * or a function which should return this array
             */
            remoteScript: {
                value: "",
                getter: function() {
                    var dashboard = Y.namespace("Wegas.Config.Dashboard");
                    return Y.Lang.isFunction(dashboard) ?
                        dashboard().remoteScript :
                        dashboard.remoteScript;
                }
            }
        }
    });
    Wegas.Dashboard = Dashboard;

    Y.DataTable.BodyView.Formatters.colored = function(col) {
        col.className = 'wegas-dashboard-colored';
        return function(o) {
            var color = o.value < 75 ? "#FFF1B3" : (o.value > 125 ? "#C1FFB3" : "#E7FFB3");
            //var color = o.value < 95 ? "rgba(255, 0, 0, 0.5)" : (o.value > 105 ? "rgba(255, 204, 0, 0.5)" : "rgba(97,
            // 186, 9, 0.5)");
            return "<span style='background-color: " + color + "'>" + (o.value || "-") + "</span>";
        };
    };
});
