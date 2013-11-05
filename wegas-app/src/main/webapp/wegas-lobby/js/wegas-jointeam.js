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
        CONTENT_TEMPLATE: "<div><div class=\"title\"></div><div class=\"description wegas-loading-div\"></div></div>",
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
                    gameModel = Y.Wegas.Facade.GameModel.cache.findById(game.get("gameModelId")),
                    teamName = (entity instanceof Y.Wegas.persistence.Team) ? entity.get("name")
                    : game.get("name") + "-" + (game.get("teams").length + 1),
                    firstUserCfg = [teamName, "", null, null];

            cb.one(".title").setHTML("" + gameModel.get("name") + " <br />" + game.get("name"));// Set game name

            if ((entity instanceof Y.Wegas.persistence.Game &&
                    !(gameModel && gameModel.get("properties.freeForAll") === "true"))// For games that are free for all (no teams)
                    || entity instanceof Y.Wegas.persistence.Team) {            // or for teams,
                choices = Y.Array.map(teams, function(i) {                      // render team selection
                    return {
                        label: i.get("name"),
                        value: i.get("id")
                    };
                });

                if (choices.length === 0) {
                    choices.push({
                        label: "No team created"
                    });
                    emptyChoices = true;
                }

                cb.append("<br /><div class=\"title\">Team</div>");

                this.teamField = new Y.inputEx.MultipleOptions({//                Create team edition field
                    parentEl: cb,
                    fields: [{
                            type: "select",
                            choices: choices,
                            label: "Join an existing team"
                        }, {
                            type: "string",
                            label: "Name",
                            typeInvite: "teamName",
                            required: true,
                            value: teamName
                        }]
                });

                if (emptyChoices) {                                             // Disable team selection if it's empty
                    this.teamField.inputs[0].disable();
                    this.teamField.inputs[1].el.focus();
                }

                this.teamField.inputs[0].hide();                                // Disable team selection everywhere (temporary)
                this.teamField.inputs[1].el.focus();

                cb.append("<div style=\"color: #505050;\">Members</div>"
                        + "<div class=\"header yui3-g\"><div class=\"yui3-u\">Email</div><div class=\"yui3-u\">Password</div><div class=\"yui3-u\">First name</div><div class=\"yui3-u\">Last name</div></div>");

                this.playersField = new Y.inputEx.ListField({//                    Render team edition
                    parentEl: cb,
                    useButtons: true,
                    elementType: {
                        type: "combine",
                        fields: [{
                                //type: "email",
                                typeInvite: "required",
                                required: true,
                                size: 13
                            }, {
                                type: "password",
                                required: true,
                                //typeInvite: "password",                       // typeInvite dont work on password in inputex
                                size: 13
                            }, {
                                typeInvite: "optional",
                                size: 13
                            }, {
                                typeInvite: "optional",
                                size: 13
                            }]
                    },
                    value: [firstUserCfg]
                });
                cb.all("input[type=\"password\"]").setAttribute("placeholder", "required");// Put placeholder on all passwords
                cb.one(".inputEx-ListField").append(cb.one("img.inputEx-ListField-addButton"));// Place add button at the end of the list
            }

            this.joinButton = new Y.Button({//                                  // Render the button
                label: "Start playing",
                render: cb
            });

            Y.Wegas.Facade.GameModel.cache.getWithView(gameModel, "Extended", {/// Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        cb.one(".description").setHTML(e.response.entity.get("description") || "<em><center>No description available</em></center>")
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
                var entity = this.get("entity");
                if (!this.teamField) {                                          // 1st case: free for all games or joining a team directly,
                    this.sendTokenJoinGame(entity.get("token"));                // use the token to join

                } else if (this.teamField.getSelected()
                        instanceof Y.inputEx.SelectField) {                     // 2nd case, player selected a team,
                    var selectedField = this.teamField.getSelected(),
                            value = selectedField.getValue();

                    if (selectedField.validate() && value) {
                        this.sendJoinTeamRequest(value);                        // join target team
                    } else {
                        this.showMessage("error", "Select a valid team");
                    }
                } else {                                                        // 3rd case: player entered a new team name,
                    var selectedField = this.teamField.getSelected(),
                            name = selectedField.getValue();

                    if (!this.playersField.validate()) {
                        this.showMessage("error", "Enter valid emails and passwords");
                        return;
                    }
                    if (name === "") {
                        this.showMessage("error", "Enter a valid team name");
                        return;
                    }
                    this.showOverlay();
                    if (entity instanceof Y.Wegas.persistence.Team) {           // If we are joining an existing team,
                        if (name !== entity.get("name")) {                      // If team name was edited,
                            entity.set("name", name);
                            Y.Wegas.Facade.Game.sendRequest({//                 // update team
                                request: "/Team/" + entity.get("id"),
                                cfg: {
                                    method: "PUT",
                                    updateCache: !this.get("customEvent"),
                                    data: entity.toObject()
                                }
                            });
                        }
                        this.sendJoinTeamRequest(entity.get("id"));             // join the team
                    } else {                                                    // Else if the team does not exist,
                        Y.Wegas.Facade.Game.sendRequest({//                     // create it
                            request: "/" + entity.get("id") + "/CreateTeam/" + name,
                            cfg: {
                                method: "POST",
                                updateCache: !this.get("customEvent")
                            },
                            on: {
                                success: Y.bind(function(e) {
                                    this.sendJoinTeamRequest(e.response.entity.get("id"));// and join it
                                }, this),
                                failure: Y.bind(function(e) {
                                    this.hideOverlay();
                                    this.showMessage("error", e.response.results.message || "Error creating team");
                                }, this)
                            }
                        });
                    }
                }
            }, this);
        },
        destructor: function() {
            if (this.teamField) {
                this.teamField.destroy();
                this.playersField.destroy();
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

    var GameDescription = Y.Base.create("wegas-gamedescription", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.JoinTeam# */
        CONTENT_TEMPLATE: "<div><div class=\"title\"></div><div class=\"description wegas-loading-div\"></div></div>",
        // *** Private fields *** //

        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    entity = this.get("entity"),
                    game = (entity instanceof Y.Wegas.persistence.Team) ? Y.Wegas.Facade.Game.cache.findById(entity.get("gameId"))
                    : entity,
                    gameModel = Y.Wegas.Facade.GameModel.cache.findById(game.get("gameModelId"));

            cb.one(".title").setHTML("" + gameModel.get("name") + " <br />" + game.get("name")); // Add title

            Y.Wegas.Facade.GameModel.cache.getWithView(gameModel, "Extended", {/// Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        cb.one(".description").setHTML(e.response.entity.get("description") || "<em><center>No description available</em></center>")
                                .removeClass("wegas-loading-div");
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
    Y.namespace('Wegas').GameDescription = GameDescription;
});
