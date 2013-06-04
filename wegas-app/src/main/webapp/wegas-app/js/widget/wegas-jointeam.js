/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-jointeam', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.JoinTeam
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class class for join a team
     * @constructor
     * @description Allows just to join a team
     */
    var CONTENTBOX = "contentBox",
            JoinTeam = Y.Base.create("wegas-jointeam", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.JoinTeam# */
        // *** Private fields *** //

        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var i, cb = this.get(CONTENTBOX),
                    game = this.get("entity"),
                    gameModel = Y.Wegas.Facade.GameModel.cache.findById(game.get("gameModelId")),
                    teams = game.get("teams"),
                    choices = [];

            this.joinTeamButton = new Y.Button({
                label: "Join team"
            });
            this.createButton = new Y.Button({
                label: "Create team"
            });

            if (gameModel.get("properties")["freeForAll"] === "true") {         // For free for all games
                this.sendJoinTeamRequest(game.get("teams")[0].get("id"));       // directly join
                return;
            }

            // Render team selection
            for (i = 0; i < teams.length; i = i + 1) {
                choices.push({
                    label: teams[i].get("name"),
                    value: teams[i].get("id")
                });
            }
            if (choices.length === 0) {
                choices.push({
                    label: "-- No team --",
                    value: ""
                });
            }

            this.teamsField = new Y.inputEx.SelectField({
                required: "true",
                parentEl: cb,
                choices: choices,
                label: "Select the team you want to join"
            });
            this.joinTeamButton.render(cb);

            // Render team creation
            this.createTeamField = new Y.inputEx.StringField({
                required: "true",
                parentEl: cb,
                label: "OR Create a new team:"
            });
            this.createButton.render(cb);
        },
        /**
         * @function
         * @private
         * @description All events are added to the buttons
         * Create team button call rest url : rest/GameModel/{gameModelID}/Game/{gameID}/CreateTeam/{teamName}
         */
        bindUI: function() {

            this.joinTeamButton.on("click", function(e) {                       // Join an existing team
                if (this.teamsField.validate()) {
                    this.sendJoinTeamRequest(this.teamsField.getValue());
                }
            }, this);

            this.createButton.on("click", function(e) {                         // Create a new team
                if (this.createTeamField.validate()) {
                    Y.Wegas.Facade.Game.sendRequest({
                        request: "/" + this.get("entity").get("id") + "/CreateTeam/" + this.createTeamField.getValue(),
                        cfg: {
                            method: "POST"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                this.sendJoinTeamRequest(e.response.entity.get("id"));
                            }, this),
                            failure: Y.bind(function(e) {
                                this.showMessage("error", e.response.results.message || "Error creating team", 4000);
                            }, this)
                        }
                    });
                }
            }, this);
        },
        /**
         * @function
         * @private
         * @description User rest request: rest/GameModel/1/Game/{gameModelID}/JoinTeam/{teamID}
         */
        sendJoinTeamRequest: function(teamId) {
            Y.Wegas.Facade.Game.sendRequest({
                request: "/JoinTeam/" + teamId,
                on: {
                    success: Y.bind(function() {
                        this.showMessage("success", "Game joined, it has been added to your games", 1000000000);
                        this.get("contentBox").empty();
                        Y.fire("gameJoined", {gameId: this.get("entity").get("id")});
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", "Error joining team");
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
    Y.namespace('Wegas').JoinTeam = JoinTeam;
});
