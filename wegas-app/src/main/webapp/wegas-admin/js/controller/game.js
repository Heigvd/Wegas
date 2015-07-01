/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global define*/
define(["ember"], function(Ember) {
    "use strict";
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
                var gameId = this.get("model").get("gameId");
                Ember.$.ajax("rest/GameModel/Game/" + gameId, {method: "DELETE"});
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
        gameLink: function(key, value) {
            return "host.html?gameId=" + this.get("model").get("gameId");
        }.property("gameId"),
        createdTime: function(key, value) {
            if (value === undefined) {
                return new Date(this.get("model").get("createdTime")).toLocaleDateString();
            }
        }.property("createdTime")
    });
})