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
YUI.add('wegas-join', function(Y) {
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
        CONTENT_TEMPLATE: "<div><div class=\"title\"></div>"
                + "<div class=\"description wegas-loading-div\"></div>"
                + "<div class=\"teamselection\"></div>"
                + "</div>",
        // *** Private fields *** //

        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    game = this.getTargetGame();

            this.joinButton = new Y.Button({//                                  // Render the button
                label: "Start playing",
                render: cb,
                visible: false
            });

            Y.Wegas.Facade.Game.cache.getWithView(game, "Extended", {//         // Get the game model full description
                on: {
                    success: Y.bind(this.onGameRetrieved, this)
                }
            });
        },
        bindUI: function() {
            this.joinButton.on("click", this.onJoinClick, this);                // On join button click
        },
        destructor: function() {
            if (this.teamField) {
                this.teamField.destroy();
                //this.playersField.destroy();
            }
            this.joinButton.destroy();
        },
        onGameRetrieved: function(e) {
            var emptyChoices, choices,
                    cb = this.get(CONTENTBOX),
                    teamSelectionNode = cb.one(".teamselection"),
                    entity = this.getTargetEntity(),
                    game = this.getTargetGame(),
                    teams = game.get("teams"),
                    // gameModel = Y.Wegas.Facade.GameModel.cache.findById(game.get("gameModelId")),
                    gameModel = e.response.entity.get("gameModel"),
                    teamName = (entity instanceof Y.Wegas.persistence.Team) ? entity.get("name")
                    : game.get("name") + "-" + (game.get("teams").length + 1),
                    firstUserCfg = [teamName, "", null, null];

            cb.one(".title").setHTML("" + gameModel.get("name") + " <br />" + game.get("name"));// Set game name
            cb.one(".description").setHTML(e.response.entity.get("description") || "<em><center>No description available</em></center>")
                    .removeClass("wegas-loading-div");

            var showTeamSelection = false,
                    showTeamCreation = false,
                    showTeamEdition = false;                                    // Default case, free for all games

            if (entity instanceof Y.Wegas.persistence.Team) {                   // If target entity is a team
                if (gameModel.get("properties.freeForAll")) {                   // If game is free for all (no team)
                    this.sendJoinTeamRequest(entity.get("id"));                 // join it directly
                } else if (entity.get("players").length === 0) {                // and this team is empty, (first connectin to this team)
                    showTeamEdition = true;                                     // display team composition edition
                } else {
                    this.showMessageBis("error",
                            "This team has already been created. You can contact it's members so they can join you in.");
                }
            } else if (entity instanceof Y.Wegas.persistence.Game && // If target entity is a game
                    !(gameModel && gameModel.get("properties.freeForAll"))) {   // and its game is not free for all (uses teams)
                showTeamCreation = true;
            }
            if (showTeamCreation || showTeamEdition) {
                teamSelectionNode.append("<br /><div class=\"title\">Team</div>");
            }
            this.showTeamEdition = showTeamEdition;
            this.showTeamCreation = showTeamCreation;
            this.showTeamSelection = showTeamSelection;

            if (showTeamCreation || showTeamEdition) {                          // Render Team creation option
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

                this.teamField = new Y.inputEx.MultipleOptions({//                Create team edition field
                    parentEl: teamSelectionNode,
                    fields: [{
                            type: "select",
                            choices: choices,
                            label: "Select an existing team"
                        }, {
                            type: "string",
                            label: "Name",
                            typeInvite: "Or create new one",
                            required: true,
                            value: teamName
                        }]
                });

                if (emptyChoices) {                                             // Disable team selection if it's empty
                    this.teamField.inputs[0].disable();
                    this.teamField.inputs[1].el.focus();
                }
                if (!showTeamSelection) {
                    this.teamField.inputs[0].hide();                            // Disable team selection everywhere (temporary)
                    this.teamField.inputs[1].el.focus();
                }

            }
            if (showTeamEdition || showTeamCreation) {
                this.teamEdition = new Y.Wegas.TeamEdition({
                    render: teamSelectionNode,
                    entity: entity
                });
                this.teamEdition.addExistingAccount(
                        Y.Wegas.Facade.User.cache.get("currentUser").getMainAccount());// Push  current user to the team's player list
            }

            this.joinButton.set("visible", true);
        },
        onJoinClick: function() {
            var entity = this.getTargetEntity(),
                    selectedField = (this.teamField) ? this.teamField.getSelected() : null,
                    name = (selectedField) ? selectedField.getValue() : null;

            if (!this.teamEdition.playersField.validate()) {
                this.showMessage("error", "Invalid name, password or email");
                return;
            }
            if (this.showTeamCreation) {
                if (name === "") {
                    this.showMessage("error", "Enter a valid team name");
                    return;
                }
                this.showOverlay();
                Y.Wegas.Facade.Game.sendRequest({//                     // create it
                    request: "/" + entity.get("id") + "/CreateTeam/" + name,
                    cfg: {
                        method: "POST",
                        updateCache: false
                    },
                    on: {
                        success: Y.bind(function(e) {
                            this.sendMultiJoinTeamRequest(e.response.entity.get("id"));// and join it
                        }, this),
                        failure: Y.bind(function(e) {
                            this.hideOverlay();
                            this.showMessage("error", e.response.results.message || "Error creating team");
                        }, this)
                    }
                });
            } else if (this.showTeamEdition) {
                if (name === "") {
                    this.showMessage("error", "Enter a valid team name");
                    return;
                }
                this.showOverlay();
                if (name !== entity.get("name")) {                              // If team name was edited,
                    entity.set("name", name);
                    Y.Wegas.Facade.Game.sendRequest({//                         // update team name
                        request: "/Team/" + entity.get("id"),
                        cfg: {
                            method: "PUT",
                            updateCache: false,
                            data: entity.toObject()
                        }
                    });
                }
                this.sendMultiJoinTeamRequest(entity.get("id"));
            } else if (this.showTeamSelection) {
                // todo
            } else {                                                            // Free for all games or joining a team directly,
                this.sendTokenJoinGame(this.getTargetEntity().get("token"));    // use the token to join
            }

//            if (!this.teamField) {                                          // 1st case: free for all games or joining a team directly,
//                this.sendTokenJoinGame(this.getTargetEntity().get("token"));// use the token to join
//
//            } else if (this.teamField.getSelected()
//                    instanceof Y.inputEx.SelectField) {                     // 2nd case, player selected a team,
//                var selectedField = this.teamField.getSelected(),
//                        value = selectedField.getValue();
//
//                if (selectedField.validate() && value) {
//                    this.sendJoinTeamRequest(value);                        // join target team
//                } else {
//                    this.showMessage("error", "Select a valid team");
//                }
//            } else {                                                        // 3rd case: player entered a new team name,
//                var selectedField = this.teamField.getSelected(),
//                        name = selectedField.getValue();
//
////                    if (!this.playersField.validate()) {
////                        this.showMessage("error", "Enter valid emails and passwords");
////                        return;
////                    }
//                if (name === "") {
//                    this.showMessage("error", "Enter a valid team name");
//                    return;
//                }
//                this.showOverlay();
//                if (entity instanceof Y.Wegas.persistence.Team) {           // If we are joining an existing team,
//                    if (name !== entity.get("name")) {                      // If team name was edited,
//                        entity.set("name", name);
//                        Y.Wegas.Facade.Game.sendRequest({//                 // update team
//                            request: "/Team/" + entity.get("id"),
//                            cfg: {
//                                method: "PUT",
//                                updateCache: !this.get("customEvent"),
//                                data: entity.toObject()
//                            }
//                        });
//                    }
//                    this.sendJoinTeamRequest(entity.get("id"));             // join the team
//                } else {                                                    // Else if the team does not exist,
//                    Y.Wegas.Facade.Game.sendRequest({//                     // create it
//                        request: "/" + entity.get("id") + "/CreateTeam/" + name,
//                        cfg: {
//                            method: "POST",
//                            updateCache: !this.get("customEvent")
//                        },
//                        on: {
//                            success: Y.bind(function(e) {
//                                this.sendJoinTeamRequest(e.response.entity.get("id"));// and join it
//                            }, this),
//                            failure: Y.bind(function(e) {
//                                this.hideOverlay();
//                                this.showMessage("error", e.response.results.message || "Error creating team");
//                            }, this)
//                        }
//                    });
//                }
//            }

        },
        getTargetEntity: function() {
            var entity = this.get("entity");
            if (Y.Lang.isArray(entity)) {
                return entity[0];
            } else {
                return entity;
            }
        },
        getTargetGame: function() {
            var entity = this.get("entity");
            if (Y.Lang.isArray(entity)) {
                if (entity[1]) {
                    return entity[1];
                } else {
                    return entity[0];
                }
            } else if (entity instanceof Y.Wegas.persistence.Team) {
                return Y.Wegas.Facade.Game.cache.findById(entity.get("gameId"));
            } else {
                return entity;
            }
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
                    updateCache: false
                },
                on: {
                    success: Y.bind(function() {
                        this.showMessage("success", "Game joined");

                        Y.fire("gameJoined", {
                            gameId: this.getTargetGame().get("id"),
                            game: this.getTargetGame()
                        });
                        this.hideOverlay();

                        this.get("contentBox").empty();
                        var parent = this.get("parent");
                        if (parent) {
                            parent.remove();
                            parent.destroy();
                        }
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("error", "Error joining team");
                    }, this)
                }
            });
        },
        sendMultiJoinTeamRequest: function(teamId) {
            Y.Wegas.Facade.Game.sendRequest({//                                 // Add all player to the list in the list to the target game
                request: "/JoinTeam/" + teamId,
                cfg: {
                    method: "POST",
                    data: this.teamEdition.getAccounts()
                },
                on: {
                    success: Y.bind(this.onGameJoined, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @description All events are added to the buttons
         * Create team button call rest url : rest/GameModel/{gameModelID}/Game/{gameID}/CreateTeam/{teamName}
         */
        onGameJoined: function(e) {
            this.showMessage("success", "Game joined");

            Y.fire("gameJoined", {
                gameId: e.response.entity.get("id"),
                game: e.response.entity
//                gameId: this.getTargetGame().get("id"),
//                game: this.getTargetGame()
            });
            this.hideOverlay();

            this.destructor();
            this.get("contentBox").empty();

            var parent = this.get("parent");
            if (parent) {
                parent.remove();
                parent.destroy();
            }
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

    var TeamEdition = Y.Base.create("wegas-editteam", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class=\"header yui3-g\">"
                + "<div class=\"yui3-u\">First name</div>"
                + "<div class=\"yui3-u\">Last name</div>"
                + "<div class=\"yui3-u\">Email</div>"
                + "<div class=\"yui3-u\">Password</div></div>"

                + "<div class=\"uneditable-players\"></div></div>",
        renderUI: function() {
            var cb = this.get("contentBox");

            this.otherAccounts = []

            this.playersField = new Y.inputEx.ListField({//                     // Render team edition
                parentEl: cb,
                useButtons: true,
                elementType: {
                    type: "group",
                    required: true,
                    fields: [{
                            name: "@class",
                            type: "hidden",
                            value: "JpaAccount"
                        }, {
                            name: "firstname",
                            required: true,
                            typeInvite: "required",
                            size: 13
                        }, {
                            name: "lastname",
                            typeInvite: "required",
                            required: true,
                            size: 13
                        }, {
                            name: "email",
                            type: "email",
                            typeInvite: "optional",
                            //required: true,
                            size: 13
                        }, {
                            name: "password",
                            type: "password",
                            //required: true,
                            //typeInvite: "password",                           // typeInvite dont work on password in inputex
                            size: 13
                        }]
                }
                // value: [firstUserCfg]
            });
            cb.all("input[type=\"password\"]").setAttribute("placeholder", "required");// Put placeholder attribute on all password fields
            cb.one(".inputEx-ListField").append(cb.one("img.inputEx-ListField-addButton"));// Move add button at the end of the list
        },
        addExistingAccount: function(account) {
            var cb = this.get("contentBox"),
                    firstname = (account instanceof Y.Wegas.persistence.GuestJpaAccount) ? account.getPublicName() :
                    account.get("firstname");

            this.otherAccounts.push(account.toObject());

            cb.one(".uneditable-players").append("<div class=\"yui3-g\">"
                    + "<div class=\"yui3-u\">" + (firstname || account.get("name")) + "</div>"
                    + "<div class=\"yui3-u\">" + (account.get("lastname") || "") + "</div>"
                    + "<div class=\"yui3-u\">*****</div>"
                    + "<div class=\"yui3-u\">*****</div></div>");
        },
        getAccounts: function() {
            return Y.Array.map(this.playersField.getValue().concat(this.otherAccounts), function(i) {
                delete i.name;
                return i;
            });
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
    Y.namespace('Wegas').TeamEdition = TeamEdition;
});
