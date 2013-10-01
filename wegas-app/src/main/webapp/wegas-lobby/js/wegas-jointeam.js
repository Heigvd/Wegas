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

            if (gameModel && gameModel.get("properties")["freeForAll"]) {       // For free for all games
                this.sendTokenJoinGame(game.get("token"));                      // directly join
                cb.setContent("<center><em>Joining game</em></center>");
                return;
            }

            for (i = 0; i < teams.length; i = i + 1) {                          // Render team selection
                choices.push({
                    label: teams[i].get("name"),
                    value: teams[i].get("id")
                });
            }
            if (choices.length === 0) {
                choices.push({
                    label: "-- No team --",
                    value: null
                });
            }

            this.teamsField = new Y.inputEx.SelectField({
                parentEl: cb,
                choices: choices,
                label: "Join an existing team"
            });
            this.joinTeamButton.render(cb);

            cb.append("<br /><br /><center>OR</center><br />");


            this.createTeamField = new Y.inputEx.StringField({                  // Render team creation
                parentEl: cb,
                label: "Create your own",
                typeInvite: ""
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
                var value = this.teamsField.getValue();
                if (this.teamsField.validate() && value) {
                    this.sendJoinTeamRequest(value);
                } else {
                    this.showMessage("error", "Select a valid team");
                }
            }, this);

            this.createButton.on("click", function(e) {                         // Create a new team
                var name = this.createTeamField.getValue();
                if (name !== "") {
                    this.showOverlay();
                    Y.Wegas.Facade.Game.sendRequest({
                        request: "/" + this.get("entity").get("id") + "/CreateTeam/" + name,
                        cfg: {
                            method: "POST"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                this.hideOverlay();
                                this.sendJoinTeamRequest(e.response.entity.get("id"));
                            }, this),
                            failure: Y.bind(function(e) {
                                this.hideOverlay();
                                this.showMessage("error", e.response.results.message || "Error creating team");
                            }, this)
                        }
                    });
                } else {
                    this.showMessage("error", "Enter a valid team team");
                }
            }, this);
        },
        destructor: function() {
            if (this.teamsField) {
                this.teamsField.destroy();
            }
            if (this.createTeamField) {
                this.createTeamField.destroy();
            }
            this.joinTeamButton.destroy();
            this.createButton.destroy();
        },
        /**
         * @function
         * @private
         * @description User rest request: rest/GameModel/1/Game/{gameModelID}/JoinTeam/{teamID}
         */
        sendJoinTeamRequest: function(teamId) {
            this.showOverlay();
            Y.Wegas.Facade.Game.sendRequest({
                request: "/JoinTeam/" + teamId,
                on: {
                    success: Y.bind(function() {
                        this.showMessage("success", "Game joined");
                        this.get("contentBox").empty();

                        Y.fire("gameJoined", {gameId: this.get("entity").get("id")});

                        var parent = this.get("parent");
                        if (parent) {
                            parent.remove();
                            parent.destroy();
                        }
                        this.hideOverlay();
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("error", "Error joining team");
                    }, this)
                }
            });
        },
        sendTokenJoinGame: function(token) {
            Y.Wegas.Facade.Game.sendRequest({
                request: "/JoinGame/" + token,
                on: {
                    success: Y.bind(function(e) {

                        if (e.response.entity instanceof Y.Wegas.persistence.Team) { // If the returned value is a Team enity
                            this.sendJoinTeamRequest(e.response.entity.get("id"));
                        } else {
                            // TODO
                        }
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Invalid token");
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
