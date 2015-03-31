/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add('wegas-resetter', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.Dashboard
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class class for join a team
     * @constructor
     */
    var CONTENTBOX = "contentBox", NAME = "name", Wegas = Y.Wegas, Resetter;

    Resetter = Y.Base.create("wegas-resetter", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Private fields *** //
        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            Y.Widget.getByNode("#centerTabView").set("selection", Y.Widget.getByNode("#centerTabView").item(1));
            this.get(CONTENTBOX).addClass("yui3-skin-wegas");
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            this.updateHandler =
                Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        /**
         * 
         * @param {type} url
         * @returns {undefined}
         */
        sendRequest: function(url) {
            Y.io(Y.Wegas.app.get("base") + url, {
                "method": "GET"
            });
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            var game, teams, team, players, player, content, i, j, k, l;
            content = "<ul>";
            game = Wegas.Facade.Game.cache.getCurrentGame();
            content += "<li>Game: " + game.get("name") + "(<a target='_blank' href='" + Y.Wegas.app.get("base") + "rest/GameModel/Game/" + game.get("id") + "/Reset'" + ">reset</a>)</li>";
            content += "<li><UL>";
            teams = game.get("teams");
            for (j in teams) {
                team = teams[j];
                content += "<li>Team: " + team.get("name") + "(<a target='_blank' href='" + Y.Wegas.app.get("base") + "rest/GameModel/Game/Team/" + team.get("id") + "/Reset'>reset</a>)</li>";
                content += "<LI><UL>";
                players = team.get("players");
                for (k in players) {
                    player = players[k];
                    content += "<li>Player: " + player.get("name") + "(<a target='_blank' href='" + Y.Wegas.app.get("base") + "rest/GameModel/Game/Team/" + team.get("id") + "/Player/" + player.get("id") + "/Reset'>reset</a>)</li>";
                }
                content += "</LI></UL>";
            }
            content += "</li></UL>";

            this.get(CONTENTBOX).setContent(content);
        },
        destructor: function() {
            this.updateHandler.detach();
        }
    }, {
    });
    Wegas.Resetter = Resetter;
});
