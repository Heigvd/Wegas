/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
    var CONTENTBOX = "contentBox", NAME = "name", Wegas = Y.Wegas, Dashboard;

    Dashboard = Y.Base.create("wegas-dashboard", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Private fields *** //
        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var cfg = this.get("dataTableCfg");

            cfg.columns = Y.Array.map(cfg.columns, function(c) {                // Add some default properties to columns
                return Y.mix(c, {
                    allowHTML: true,
                    sortable: true
                });
            });
            cfg = Y.mix(cfg, {//                                                // Add cfg default values
                width: "100%"
            });
            this.table = new Y.DataTable(cfg)                                   // Render datatable
                .render(this.get(CONTENTBOX))
                .set('strings.emptyMessage', "<em><center><br /><br />No teams</center></em>");

            this.get(CONTENTBOX).addClass("yui3-skin-wegas");
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            this.updateHandler =
                Wegas.Facade.Variable.after("update", this.syncUI, this);       // Listen updates on the target datasource
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            Y.log("sync()", "info", "Wegas.LobbyDataTable");
            this.table.set("data", this.genData());
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
        genData: function() {
            var gameModel = Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                game = Wegas.Facade.Game.cache.getCurrentGame();

            if (gameModel.get("properties.freeForAll")) {
            } else {
                return Y.Array.map(game.get("teams"), function(t) {
                    return {
                        name: t.get("name"),
                        team: t,
                        player: t.get("players").length > 0 ? t.get("players")[0] : null
                    };
                });
            }
        }
    }, {
        ATTRS: {
            dataTableCfg: {
                value: {
                    columns: [{
                            key: "iconCSS",
                            formatter: "icon",
                            label: " ",
                            sortable: false,
                            width: "27px"
                        }, {
                            key: NAME,
                            label: "Name"
                        }, {
                            label: "Phase",
                            script: "var names = ['Initiating', 'Planning', 'Executing', 'Closing'];return names[Variable.find(gameModel, 'currentPhase').getValue(self)-1]",
                            formatter: "variable"
                        }, {
                            label: "Period",
                            formatter: "variable",
                            script: "Variable.find(gameModel, 'currentPeriod').item(currentPhase.value-1).getValue(self)"
                        }, {
                            label: "Choices"
                        }, {
                            label: "Management",
                            formatter: "variable",
                            script: "Variable.find(gameModel, 'managementApproval').getValue(self)"
                        }, {
                            label: "User",
                            formatter: "variable",
                            script: "Variable.find(gameModel, 'userApproval').getValue(self)"
                        }, {
                            label: "Quality",
                            formatter: "variable",
                            script: "Variable.find(gameModel, 'quality').getValue(self)"
                        }, {
                            label: "Cost",
                            formatter: "variable",
                            script: "Variable.find(gameModel, 'costs').getValue(self)"
                        }, {
                            label: "Delay",
                            formatter: "variable",
                            script: "Variable.find(gameModel, 'delay').getValue(self)"
                        }]
                }
            }
        }
    });
    Wegas.Dashboard = Dashboard;

    Y.DataTable.BodyView.Formatters.variable = function() {
        return function(o) {
            if (!o.data.player) {
                return null;
            }
            return Wegas.Facade.Variable.script.localEval(o.column.script, o.data.player);
        };
    };
    
    Y.DataTable.BodyView.Formatters.colorvariable = function() {
        return function(o) {
            if (!o.data.player) {
                return null;
            }
            var val = Wegas.Facade.Variable.script.localEval(o.column.script, o.data.player),
                css = val < 20 ? "low" : (val > 120 ? "high" : "normal");
            return "<span class='wegas-dashboard-" + css + "'>" + val + "</span>";
        };
    };
});
