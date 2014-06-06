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

    var CONTENTBOX = 'contentBox', Wegas = Y.Wegas, TokenJoin;

    /**
     * @name Y.Wegas.TokenJoin
     * @extends Y.Widget
     * @class  class for join a game and a team
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @constructor
     * @description Allows to join a game by token or a public game. Then you can
     * join or create a new team
     */
    TokenJoin = Y.Base.create("wegas-join-token", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
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
                    tokenParameter = Wegas.Helper.getURLParameter("token");

//            cb.append("<h1>Team</h1>");

            this.tokenField = new Y.inputEx.StringField({//                     // Render
                required: true,
                parentEl: cb,
                label: "Enrolment key",
                typeInvite: "type here"
            });

            this.button = new Y.Button({
                label: "Submit",
                render: cb
            });

            if (tokenParameter) {
                this.isInitialTokenTry = true;
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
            this.button.on("click", function() {                                // join a game based on a token
                if (this.tokenField.validate()) {
                    this.sendTokenJoin(this.tokenField.getValue());
                    //} else if (this.selectPublicGame.getValue() !== "") {
                    // @Todo
                    // this.joinTeam = new Wegas.SelectTeam({
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

            Wegas.Facade.Game.sendRequest({
                request: "/JoinGame/" + token + "?view=Extended",
                cfg: {
                    updateCache: false
                },
                on: {
                    success: Y.bind(function(e) {
                        var cb = this.get(CONTENTBOX),
                                entity = e.response.entity;

                        this.hideOverlay();

                        if (entity === "Team token required") {                 // Team token is required, game token was provided
                            // @fixme should show a message when this happens from the lobby

                            //} else if (entity instanceof Wegas.persistence.Game) {
                            //    gm = entity.get("gameModel");
                            //            &&
                            //        !(gm.get("properties.allowCreateTeam") || gm.get("properties.allowJoinTeam"))) {
                            if (!this.isInitialTokenTry) {
                                this.showMessageBis("error", "No game found for this key");
                            }
                        } else if (e.response.entities[0] instanceof Wegas.persistence.Team
                                && !(e.response.entities[1].get("gameModel").get("properties.freeForAll")
                                        || e.response.entities[0].get("players").length === 0)) {// If the token is already in use

                            this.showMessageBis("error",
                                    "This team has already been created. You can contact it's members so they can join you in.");
                        } else {
                            Y.log("sendTokenJoin(): Rendering team widget", "info", "Wegas.TokenJoin");
                            this.destructor();
                            this.teamWidget = new Wegas.JoinTeam({//            // Player can choose or create its team
                                entity: e.response.entities,
                                render: cb
                            });
                            this.teamWidget.addTarget(this);                    // So overlay and message events will be forwarded
                        }
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        }
    });
    Wegas.TokenJoin = TokenJoin;
});
