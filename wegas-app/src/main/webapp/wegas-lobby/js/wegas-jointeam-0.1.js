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
        CONTENT_TEMPLATE: "<div><div class=\"title\"></div><div class=\"wegas-jointeam-description wegas-loading-div\"></div></div>",
        // *** Private fields *** //

        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var emptyChoices, choices,
                    cb = this.get(CONTENTBOX),
                    entity = this.get("entity"),
                    game = this.getTargetGame(),
                    teams = game.get("teams"),
                    gameModel = Y.Wegas.Facade.GameModel.cache.findById(game.get("gameModelId"));

//            if (this.get("parent")) {
//                this.get("parent").set("label", "Join " + game.get("name"));
//            } else {
                cb.one(".title").setHTML("" + gameModel.get("name") + " <br />" + game.get("name"));
//            }

            if (entity instanceof Y.Wegas.persistence.Game &&
                    !(gameModel && gameModel.get("properties.freeForAll") === "true")) { // For games that are not free for all games
                choices = Y.Array.map(teams, function(i) {                      // render team selection
                    return {
                        label: i.get("name"),
                        value: i.get("id")
                    };
                });
                if (choices.length === 0) {
                    choices.push({
                        label: "No team created",
                        value: null
                    });
                    emptyChoices = true;
                }

                this.teamField = new Y.inputEx.MultipleOptions({
                    parentEl: cb,
                    fields: [{
                            type: "select",
                            choices: choices,
                            label: "Join an existing team"
                        }, {
                            type: "string",
                            label: "Create your own",
                            typeInvite: ""
                        }]
                });

                if (emptyChoices) {
                    this.teamField.inputs[0].disable();
                    this.teamField.inputs[1].el.focus();
                }
            }

            this.joinButton = new Y.Button({
                label: "Start playing",
                render: cb
            });                                                                 // Render the button

            Y.Wegas.Facade.GameModel.cache.getWithView(gameModel, "Extended", {// Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        cb.one(".wegas-jointeam-description").setHTML(e.response.entity.get("description") || "<em><center>No description available</em></center>")
                                .removeClass("wegas-loading-div");
                    }, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @description All events are added to the buttons
         * Create team button call rest url : rest/GameModel/{gameModelID}/Game/{gameID}/CreateTeam/{teamName}
         */
        bindUI: function() {

            this.joinButton.on("click", function(e) {                           // Join button click
                if (!this.teamField) {                                          // 1st case: free for all games or joining a team directly
                    this.sendTokenJoinGame(this.get("entity").get("token"));    // use the token to join

                } else if (this.teamField.getSelected()
                        instanceof Y.inputEx.SelectField) {                     // 2nd case, player selected a team
                    var selectedField = this.teamField.getSelected(),
                            value = selectedField.getValue();

                    if (selectedField.validate() && value) {
                        this.sendJoinTeamRequest(value);
                    } else {
                        this.showMessage("error", "Select a valid team");
                    }
                } else {                                                        // 3rd case: player entered a new team name
                    var selectedField = this.teamField.getSelected(),
                            name = selectedField.getValue();
                    if (name !== "") {
                        this.showOverlay();
                        Y.Wegas.Facade.Game.sendRequest({
                            request: "/" + this.get("entity").get("id") + "/CreateTeam/" + name,
                            cfg: {
                                method: "POST",
                                updateCache: !this.get("customEvent")
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
                        this.showMessage("error", "Enter a valid team name");
                    }
                }
            }, this);
        },
        destructor: function() {
            if (this.teamField) {
                this.teamField.destroy();
            }
            this.joinButton.destroy();
        },
        getTargetGame: function() {
            var entity = this.get("entity");
            return (entity instanceof Y.Wegas.persistence.Team) ? Y.Wegas.Facade.Game.cache.findById(entity.get("gameId"))
                    : entity;
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
                cfg: {
                    updateCache: !this.get("customEvent")
                },
                on: {
                    success: Y.bind(function() {
                        this.showMessage("success", "Game joined");
                        this.get("contentBox").empty();

                        Y.fire("gameJoined", {gameId: this.getTargetGame().get("id")});

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
            this.showOverlay();
            Y.Wegas.Facade.Game.sendRequest({
                request: "/JoinGame/" + token,
                cfg: {
                    updateCache: !this.get("customEvent")
                },
                on: {
                    success: Y.bind(function(e) {

                        if (e.response.entity instanceof Y.Wegas.persistence.Team) { // If the returned value is a Team enity
                            this.sendJoinTeamRequest(e.response.entity.get("id"));
                        } else {
                            // TODO
                            this.hideOverlay();
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
            entity: {},
            customEvent: {
                value: false
            }
        }
    });
    Y.namespace('Wegas').JoinTeam = JoinTeam;
});
