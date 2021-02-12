/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/*global define*/
define(["ember-data", "tool/rawtransform"], function(DS) {
    "use strict";

    var attr = DS.attr, game = DS.Model.extend({
        "@class": attr("string", {defaultValue: "GameAdmin"}),
        gameName: attr("string"),
        creator: attr("string"),
        gameStatus: attr("string"),
        gameModelName: attr("string"),
        createdTime: attr("date"),
        playerCount: function() {
            return this.get("players").length;
        }.property("players"),
        playerDetails: function() {
            // SURVEY, LIVE, FAILED, OTHER
            return this.get("players").reduce(function(result, player) {
                switch (player.status) {
                    case "LIVE":
                        result.LIVE++;
                        break;
                    case "FAILED":
                        result.FAILED++;
                        break;
                    case "SURVEY":
                        result.SURVEY++;
                        break;
                    default:
                        result.OTHER++;
                        break;
                }
                result.total++;
                return result;
            }, {LIVE: 0, FAILED: 0, SURVEY: 0, OTHER: 0, TOTAL: 0});
        }.property("players"),
        players: attr("raw"),
        // This is JSON:
        teams: attr("raw"),
        gameId: attr("number"),
        status: attr("string"),
        comments: attr("string")
    });
    return game;
});
