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
YUI.add('wegas-join-token', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', TokenJoin;

    /**
     * @name Y.Wegas.TokenJoin
     * @extends Y.Widget
     * @class  class for join a game and a team
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @constructor
     * @description Allows to join a game by token or a public game. Then you can
     * join or create a new team
     */
    TokenJoin = Y.Base.create("wegas-join-token", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.TokenJoin#
         */
        // *** Private fields *** //

        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    tokenParameter = Y.Wegas.Helper.getURLParameter("token");

            this.tokenField = new Y.inputEx.StringField({// Render
                required: true,
                parentEl: cb,
                label: "Enrolment key",
                typeInvite: "type here"
            });

            if (this.get("displayPublicGames")) {
                this.renderPublicGames();
            }

            this.button = new Y.Button({
                label: "Submit",
                render: cb
            });

            if (tokenParameter) {
                this.sendTokenJoin(tokenParameter);
            }
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

            this.button.on("click", function() {                                // join a game based on a token
                if (this.tokenField.validate()) {
                    this.sendTokenJoin(this.tokenField.getValue());
                    //} else if (this.selectPublicGame.getValue() !== "") {
                    // @Todo
                    // this.joinTeam = new Y.Wegas.SelectTeam({
                    //    entity: this.selectPublicGame.getValue()
                    //}
                } else {
                    this.showMessage("error", "Enter a valid token");
                    return;
                }
            }, this);
        },
        destructor: function() {
            if (this.teamWidget) {
                this.teamWidget.destroy();
            }
            this.button.destroy();
            this.tokenField.destroy();
        },
        /**
         * @function
         * @private
         * @description Method for join a game by token
         * Call rest request for join the game : rest/GameModel/1/Game/{gameModelID}/JoinGame/{token}
         */
        sendTokenJoin: function(token) {
            this.showOverlay();
            Y.log("sendTokenJoin()", "info", "Wegas.TokenJoin");

            Y.Wegas.Facade.Game.sendRequest({
                request: "/JoinGame/" + token + "?view=Extended",
                cfg: {
                    updateCache: false
                },
                on: {
                    success: Y.bind(function(e) {
                        var cb = this.get(CONTENTBOX),
                                entity = e.response.entity,
                                gm;
                        this.hideOverlay();

                        if (entity === "Team token required") {                 // Team token is required, game token was provided
                            // @fixme should show a message when this happens from the lobby

//                        } else if (entity instanceof Y.Wegas.persistence.Game) {
//                            gm = entity.get("gameModel");
//                                    &&
//                                !(gm.get("properties.allowCreateTeam") || gm.get("properties.allowJoinTeam"))) {
                        } else if (e.response.entities[0] instanceof Y.Wegas.persistence.Team
                                && !(e.response.entities[1].get("gameModel").get("properties.freeForAll")
                                || e.response.entities[0].get("players").length === 0)) {// If the token is already in use

                            this.showMessageBis("error",
                                    "This team has already been created. You can contact it's members so they can join you in.");
                        } else {
                            Y.log("sendTokenJoin(): Rendering team widget", "info", "Wegas.TokenJoin");
                            this.destructor();
                            this.teamWidget = new Y.Wegas.JoinTeam({//          // Player can choose or create its team
                                entity: e.response.entities,
                                render: cb
                            });
                            this.teamWidget.addTarget(this);                    // So overlay and message events will be forwarded
                        }
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("error", e.response.results.message || "Invalid token");
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
        renderPublicGames: function() {
            var cb = this.get("contentBox");
            cb.append('<div class="lobbyOr"><p>Or</p><div>');

            this.selectPublicGame = new Y.inputEx.SelectField({//               // Render public games
                required: false,
                parentEl: cb,
                label: "Select a public game",
                choices: [{
                        label: "Select game",
                        value: null
                    }]
            });

            Y.Wegas.Facade.PublicGames.sendRequest({//                          // Retrieve the list of public games from the server
                request: "/" + Y.Wegas.app.get('currentUser').id,
                on: {
                    success: Y.bind(function(e) {
                        var data = e.response.results.entities;
                        Y.Array.each(data, function(game) {
                            this.selectPublicGame.addChoice({
                                label: game.get("name"),
                                value: game
                            });
                        }, this);
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
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

    Y.namespace('Wegas').TokenJoin = TokenJoin;
});
