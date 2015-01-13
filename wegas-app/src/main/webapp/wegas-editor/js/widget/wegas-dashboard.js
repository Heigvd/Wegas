/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
            Y.Widget.getByNode("#centerTabView").set("selection", Y.Widget.getByNode("#centerTabView").item(1));
            var cfg = this.get("tableCfg");

            this.get(CONTENTBOX).addClass("yui3-skin-wegas");

            cfg.columns = Y.Array.map(cfg.columns, function(c) {                // Add some default properties to columns
                return Y.mix(c, {
                    allowHTML: true,
                    sortable: true,
                    key: c.label,
                    emptyCellValue: "-"
                });
            });
            //cfg = Y.mix(cfg, {//                                                // Add cfg default values
            //    width: "100%"
            //});
            this.table = new Y.DataTable(cfg)                                   // Render datatable
                .render(this.get(CONTENTBOX))
                .set('strings.emptyMessage', "<em><center><br /><br />No players</center></em>");
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
                game = Wegas.Facade.Game.cache.getCurrentGame(),
                columnsCfg = this.get("tableCfg.columns"), ret = [];

            if (gameModel.get("properties.freeForAll")) {                       // Retrieve the list of rows (depending on freeforall mode)
                Y.Array.each(game.get("teams"), function(t) {
                    Y.Array.each(t.get("players"), function(p) {
                        ret.push({
                            name: "<span class='wegas-icon wegas-icon-player'></span>" + p.get("name"),
                            team: t,
                            player: p
                        });
                    });
                });
            } else {
                ret = Y.Array.map(game.get("teams"), function(t) {
                    return {
                        //icon: "<span class='wegas-icon wegas-icon-team'></span>",
                        name: "<span class='wegas-icon wegas-icon-team'></span>" + t.get("name"),
                        team: t,
                        player: t.get("players").length > 0 ? t.get("players")[0] : null
                    };
                });
            }
            ret = Y.Array.filter(ret, function(i) {                             // Filter debug team (for game edition)
                return !(i.team instanceof Wegas.persistence.DebugTeam);
            });

            Y.Array.each(ret, function(r) {                                     // Populate players data with local eval
                Y.Array.each(columnsCfg, function(c) {
                    if (c.script && r.player) {
                        r[c.key] = Wegas.Facade.Variable.script.localEval(c.script, r.player);
                    }
                });
            });
            return ret;
        }
    }, {
        ATTRS: {
            tableCfg: {
                value: {
                    columns: [{
                            key: NAME,
                            label: "Name"
                        }]
                }
            }
        }
    });
    Wegas.Dashboard = Dashboard;

    Y.DataTable.BodyView.Formatters.colored = function(col) {
        col.className = 'wegas-dashboard-colored';
        return function(o) {
            var color = o.value < 75 ? "#FFF1B3" : (o.value > 125 ? "#C1FFB3" : "#E7FFB3");
            //var color = o.value < 95 ? "rgba(255, 0, 0, 0.5)" : (o.value > 105 ? "rgba(255, 204, 0, 0.5)" : "rgba(97, 186, 9, 0.5)");
            return "<span style='background-color: " + color + "'>" + (o.value || "-") + "</span>";
        };
    };
});
