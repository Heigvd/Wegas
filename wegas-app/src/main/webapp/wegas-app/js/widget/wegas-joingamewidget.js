/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @deprecated User wegas-joingame instead
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-joingamewidget', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
        JoinGameWidget;

    /**
     * @name Y.Wegas.JoinGameWidget
     * @extends Y.Widget
     * @class  class for join a game and a team
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @constructor
     * @description Allows to join a game by token or a public game. Then you can
     * join or create a new team
     */
    JoinGameWidget = Y.Base.create("wegas-joingamewidget", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.JoinGameWidget#
         */
        // *** Private fields *** //

        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            this.tokenField = new Y.inputEx.StringField({// Render
                required: false,
                parentEl: cb,
                label: "Enter a token to join a game",
                typeInvite: "token"
            });

            this.p = Y.Node.create('<div class="lobbyOr"><p>Or</p><div>');
            cb.append(this.p);

            this.selectPublicGame = new Y.inputEx.SelectField({// Render public games
                required: false,
                parentEl: cb,
                label: "Select a public game"
            });

            this.joinGameButton = new Y.Button({
                label: "Join game"
            });
            this.joinGameButton.render(cb);

            this.teamsField = new Y.inputEx.SelectField({// Render team selection
                required: "true",
                parentEl: cb,
                label: "Select the team you want to join"
            });
            this.teamsField.hide();
            this.joinTeamButton = new Y.Button({
                label: "Join team",
                visible: false
            });
            this.joinTeamButton.render(cb);

            this.createTeamField = new Y.inputEx.StringField({// Render team creation
                required: "true",
                parentEl: cb,
                label: "OR Create a new team:"
            });
            this.createTeamField.hide();
            this.createButton = new Y.Button({
                label: "Create team",
                visible: false
            });
            this.createButton.render(cb);

            this.showPublicGames();
        },

        /**
         * @function
         * @private
         * @description All events are added to the buttons
         * Create team button call rest url : rest/GameModel/{gameModelID}/Game/{gameID}/CreateTeam/{teamName}
         */
        bindUI: function() {
            this.tokenField.on("updated", function(e) {
                if (this.tokenField.getValue() !== "") {
                    this.selectPublicGame.setValue("");
                }
            }, this);

            this.selectPublicGame.on("updated", function(e) {
                if (this.selectPublicGame.getValue() !== "") {
                    this.tokenField.setValue("");
                }
            }, this);

            this.joinGameButton.on("click", function(e) {                      // join a game based on a token
                if (this.tokenField.getValue() !== "") {
                    this.sendJoinGame();
                } else if (this.selectPublicGame.getValue() !== "") {
                    this.currentGame = this.selectPublicGame.getValue();
                    this.showTeams();
                    this.selectPublicGame.removeChoice({
                        value: this.currentGame
                    });
                } else {
                    this.showMessage("error", "A key phrase or a public Game must be selected");
                    return;
                }
            }, this);

            this.joinTeamButton.on("click", function(e) {                      // Join an existing team
                if (this.teamsField.validate()) {
                    this.sendJoinTeamRequest(this.teamsField.getValue());
                }
            }, this);
            this.createButton.on("click", function(e) {                      // Create a new team
                if (this.createTeamField.validate()) {
                    Y.Wegas.Facade.Game.sendRequest({
                        request: "/" + this.currentGame.get("id") + "/CreateTeam/" + this.createTeamField.getValue(),
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
         * @description Method for join a game by token
         * Call rest request for join the game : rest/GameModel/1/Game/{gameModelID}/JoinGame/{token}
         */
        sendJoinGame: function() {
            Y.Wegas.Facade.Game.sendRequest({
                request: "/JoinGame/" + this.tokenField.getValue(),
                on: {
                    success: Y.bind(function(e) {
                        if (e.response.entity                               // If the returned value is a Team enity
                            instanceof Y.Wegas.persistence.Team) {
                            this.sendJoinTeamRequest(// it means we can join this team directly
                                e.response.entity.get("id"));
                        } else {
                            this.currentGame = e.response.entity;
                            this.showTeams();                               // otherwise the player can choose or create its team
                        }
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.results.message || "Invalid token", 4000);
                    }, this)
                }
            });
        },

        /**
         * @function
         * @private
         * @description Hide and show all necessary field
         */
        showTeams: function() {
            //this.msg.empty();

            this.joinGameButton.hide();
            this.tokenField.hide();
            this.selectPublicGame.hide();
            this.p.hide();
            this.joinTeamButton.show();
            this.teamsField.show();
            this.createButton.show();
            this.createTeamField.show();

            var i;
            this.teams = this.currentGame.get("teams");
            for (i = 0; i < this.teams.length; i = i + 1) {
                this.teamsField.addChoice({
                    label: this.teams[i].get("name"),
                    value: this.teams[i].get("id")
                });
            }
            if (this.teams.length == 0) {
                this.teamsField.addChoice({
                    label: "-- No team --",
                    value: ""
                });
            }
        },

        /**
         * @function
         * @private
         * @description Add all public game in a listbox
         * Use rest request for get public games: rest/PublicGames/Games/{userID}
         */
        showPublicGames: function() {
            this.selectPublicGame.addChoice({
                label: "--Select--",
                value: ""
            });

            Y.Wegas.Facade.PublicGames.sendRequest({
                request: "/" + Y.Wegas.app.get('currentUser').id,
                on: {
                    success: Y.bind(function(e) {
                        var data = e.response.results.entities;
                        Y.Array.forEach(data, function(game) {
                            this.selectPublicGame.addChoice({
                                label: game.get("name"),
                                value: game
                            });
                        }, this);
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", "Error");
                    }, this)
                }
            });
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
                    success: Y.bind(function(e) {
                        this.joinTeamSuccess();
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", "Error joining team");
                    }, this)
                }
            });
        },

        /**
         * @function
         * @private
         * @description Display the button and field for join a game by token or a public game
         */
        joinTeamSuccess: function() {
            this.showMessage("success", "Game joined, it has been added to your games", 10000);

            Y.Wegas.Facade.RegisteredGames.cache.clear();
            Y.Wegas.Facade.RegisteredGames.sendInitialRequest();

            this.joinGameButton.show();
            this.tokenField.show();
            this.selectPublicGame.show();
            this.p.show();
            this.createButton.hide();
            this.createTeamField.hide();
            this.joinTeamButton.hide();
            this.removeAllTeamsChoices();
            this.teamsField.hide();
            this.selectPublicGame.setValue("");
            this.tokenField.setValue("");
            this.createTeamField.setValue("");
        },
        /**
         * @function
         * @private
         * @description Remove all teams from the listbox
         */
        removeAllTeamsChoices: function() {
            var i;
            for (i = 0; i < this.teams.length; i = i + 1) {
                try {
                    this.teamsField.removeChoice({
                        value: this.teams[i].get("id")
                    });
                } catch (e) {
                //tried to remove an inexistant team. Certainly after having created one
                }
            }
        }
    });

    Y.namespace('Wegas').JoinGameWidget = JoinGameWidget;
});
