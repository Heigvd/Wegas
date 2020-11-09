/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global define*/
define(["ember"], function(Ember) {
    "use strict";
    /**
     * Translate ...
     */
    var DICT = {
        LIVE: "Live",
        BIN: "Archived",
        DELETE: "Delete",
        SUPPRESSED: "Suppressed"
    };
    return Ember.ObjectController.extend({
        actions: {
            editComment: function() {
                this.set("commentEdit", true);
            },
            acceptComment: function() {
                this.set('commentEdit', false);
                this.get('model').save();
            },
            forceDeletion: function() {
                var model = this.get("model"),
                    gameId = model.get("gameId");
                if (gameId) {
                    Ember.$.ajax("rest/GameModel/Game/" + gameId, {
                        method: "DELETE"
                    }).then(function() {
                        this.set("gameStatus", "SUPPRESSED");
                    }.bind(this));
                }
            }
        },
        commentEdit: false,
        isDone: function(key, value) {
            var model = this.get("model");
            if (value === undefined) {
                return model.get("status") !== "TODO";
            } else {
                if (value) {
                    model.set("status", "PROCESSED");
                } else {
                    model.set("status", "TODO");
                }
                model.save();
                return value;
            }
        }.property('status'),
        isCharged: function(key, value) {
            var model = this.get("model");
            if (value === undefined) {
                return model.get("status") === "CHARGED";
            } else {
                if (value) {
                    model.set("status", "CHARGED");
                } else {
                    model.set("status", "PROCESSED");
                }
                model.save();
                return value;
            }
        }.property('status'),
        isDelete: function() {
            return this.get("model").get("gameStatus") === "DELETE";
        }.property(),
        isSuppressed: function() {
            return this.get("model").get("gameStatus") === "SUPPRESSED";
        }.property(),
        gameLink: function(key, value) {
            return "host.html?gameId=" + this.get("model").get("gameId");
        }.property("gameId"),
        createdTime: function(key, value) {
            if (value === undefined) {
                return new Date(this.get("model").get("createdTime")).toLocaleDateString();
            }
        }.property("createdTime"),
        gameStatus: function(key, value) {
            var model = this.get("model");
            if (value in DICT) {
                model.set("gameStatus", value);
            }
            return DICT[this.get("model").get("gameStatus")];
        }.property("gameStatus"),
        doneId: function() {
            return this.get('model').get('id') + 'done';
        }.property("gameId"),
        chargedId: function() {
            return this.get('model').get('id') + 'charged';
        }.property("gameId"),
        declaredSize: function() {
            var count = 0;
            var teams = this.get("teams");
            if (teams) {
                for (var i = 0; i < teams.length; i++) {
                    count += teams[i].declaredSize;
                }
            } else {
                count = "n/a";
            }
            return count;
        }.property("declaredSize")
    });
});
