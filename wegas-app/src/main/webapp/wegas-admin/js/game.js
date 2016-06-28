/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
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
        players: attr("raw"),
        // This is JSON:
        teams: attr("raw"),
        gameId: attr("number"),
        teamCount: attr("number"),
        status: attr("string"),
        comments: attr("string")
    });
    return game;
});
