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
YUI.add('wegas-joingame', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
            JoinGame;

    /**
     * @name Y.Wegas.JoinGame
     * @extends Y.Widget
     * @class  class for join a game and a team
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @constructor
     * @description Allows to join a game by token or a public game. Then you can
     * join or create a new team
     */
    JoinGame = Y.Base.create("wegas-joingame", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.JoinGame#
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

            if (this.get("displayPublicGames")) {
                this.p = Y.Node.create('<div class="lobbyOr"><p>Or</p><div>');
                cb.append(this.p);

                this.selectPublicGame = new Y.inputEx.SelectField({// Render public games
                    required: false,
                    parentEl: cb,
                    label: "Select a public game"
                });
                this.showPublicGames();
            }

            this.joinGameButton = new Y.Button({
                label: "Join"
            });
            this.joinGameButton.render(cb);

        },
        /**
         * @function
         * @private
         * @description All events are added to the buttons
         * Create team button call rest url : rest/GameModel/{gameModelID}/Game/{gameID}/CreateTeam/{teamName}
         */
        bindUI: function() {

            if (this.get("displayPublicGames")) {
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
            }

            this.joinGameButton.on("click", function(e) {                      // join a game based on a token
                if (this.tokenField.getValue() !== "") {
                    this.sendJoinGame();
                    //} else if (this.selectPublicGame.getValue() !== "") {
                    // @Todo
                    // this.joinTeam = new Y.Wegas.SelectTeam({
                    //    entity: this.selectPublicGame.getValue()
                    //}
                } else {
                    this.showMessage("error", "A key phrase or a public Game must be selected");
                    return;
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
                        var cb = this.get(CONTENTBOX);

                        if (e.response.entity instanceof Y.Wegas.persistence.Team) { // If the returned value is a Team enity
                            Y.Wegas.Facade.Game.sendRequest({// it means we can join this team directly
                                request: "/JoinTeam/" + e.response.entity.get("id"),
                                on: {
                                    success: Y.bind(function() {
                                        this.showMessage("success", "Team joined, it has been added to your games", 10000);
                                        Y.fire("gameJoined", {
                                            gameId: e.response.entity.get("gameId")
                                        });
                                    }, this),
                                    failure: Y.bind(function(e) {
                                        this.showMessage("error", "Error joining team");
                                    }, this)
                                }
                            });
                        } else {
                            cb.empty();
                            this.teamWidget = new Y.Wegas.JoinTeam({// otherwise the player can choose or create its team
                                entity: e.response.entity
                            });
                            this.teamWidget.render(cb);
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
        }
    }, {
        ATTRS: {
            displayPublicGames: {
                value: false
            }
        }
    });

    Y.namespace('Wegas').JoinGame = JoinGame;
});
