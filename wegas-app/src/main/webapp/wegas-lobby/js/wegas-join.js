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
        CONTENT_TEMPLATE: "<div><div class=\"title\"></div><div class=\"subtitle\"></div>"
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
                label: "Join game",
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
                    gameModel = e.response.entity.get("gameModel"),
                    teamName = (entity instanceof Y.Wegas.persistence.Team) ? entity.get("name")
                    : game.get("name") + "-" + (game.get("teams").length);

            cb.one(".title").setHTML("" + gameModel.get("name") + " <br />" + game.get("name"));// Set game name
            cb.one(".subtitle").setHTML("Created by " + game.get("createdByName") + " " + Y.Wegas.Helper.smartDate(game.get("createdTime")));// Set game name
            cb.one(".description")
                    //.setHTML(e.response.entity.get("description") || "<em><center>No description available</em></center>")
                    .setHTML(e.response.entity.get("description"))
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

                teamSelectionNode.append("<div style=\"margin:10px 0\"><span style=\"color: #505050;font-style: italic;padding-left: 20px;\">Team name:</span>&nbsp;&nbsp;&nbsp;" + teamName + "</div>");

                this.teamField = new Y.inputEx.MultipleOptions({//                Create team edition field
                    parentEl: teamSelectionNode,
                    fields: [{
                            type: "hidden",
                            label: "Team name",
                            required: true,
                            value: teamName
                        }, {
                            type: "select",
                            choices: choices,
                            label: "Select an existing team"
                        }]
                });

                if (emptyChoices) {                                             // Disable team selection if it's empty
                    this.teamField.inputs[1].disable();
                    //this.teamField.inputs[0].el.focus();
                }
                if (!showTeamSelection) {
                    this.teamField.inputs[1].hide();                            // Disable team selection everywhere (temporary)
                    //this.teamField.inputs[0].el.focus();
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

            if (this.showTeamEdition || this.showTeamCreation) {
                if (!this.teamEdition.playersField.validate()) {
                    this.showMessage("error", "Invalid name, password or email");
                    return;
                }
                if (name === "") {
                    this.showMessage("error", "Enter a valid team name");
                    return;
                }
            }

            this.showOverlay();

            if (this.showTeamCreation) {                                        // If entity is a game token which allows team creation,
                Y.Wegas.Facade.Game.sendRequest({//                             // create the team
                    request: "/" + entity.get("id") + "/CreateTeam/" + name,
                    cfg: {
                        method: "POST",
                        updateCache: false
                    },
                    on: {
                        success: Y.bind(function(e) {
                            this.sendMultiJoinTeamRequest(e.response.entity.get("id"));// and then join it
                        }, this),
                        failure: Y.bind(function(e) {
                            this.hideOverlay();
                            this.showMessage("error", e.response.results.message || "Error creating team");
                        }, this)
                    }
                });
            } else if (this.showTeamEdition) {                                  // If joining
                if (name !== entity.get("name")) {                              // If team name was edited,
                    entity.set("name", name);
                    Y.Wegas.Facade.Game.sendRequest({//                         // update it
                        request: "/Team/" + entity.get("id"),
                        cfg: {
                            method: "PUT",
                            updateCache: false,
                            data: entity.toObject()
                        },
                        on: {
                            success: function() {
                                this.sendMultiJoinTeamRequest(entity.get("id"));// join the team
                            },
                            failure: Y.bind(this.defaultFailureHandler, this)
                        }
                    });
                } else {
                    this.sendMultiJoinTeamRequest(entity.get("id"));            // join the team
                }
            } else if (this.showTeamSelection) {
                // todo
            } else {                                                            // If game is Free for all games or joining a team directly,
                this.sendTokenJoinGame(this.getTargetEntity().get("token"));    // use the token to join
            }
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
                        
                        var rightTab = Y.Widget.getByNode("#rightTabView");     // Empty right tab on join
                        rightTab && rightTab.destroyAll();
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
                    success: Y.bind(this.onGameJoined, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
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
            //this.showMessage("success", "Game joined");

            Y.fire("gameJoined", {
                gameId: e.response.entity.get("id"),
                game: e.response.entity
                        //gameId: this.getTargetGame().get("id"),
                        //game: this.getTargetGame()
            });
            this.hideOverlay();

            this.destructor();
            this.get("contentBox").empty();

            var rightTab = Y.Widget.getByNode("#rightTabView");
            rightTab && rightTab.destroyAll();
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
        CONTENT_TEMPLATE: "<div><div class=\"title\"></div><div class=\"subtitle\"></div><div class=\"description wegas-loading-div\"></div></div>",
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
                    : entity;

            cb.one(".subtitle").setHTML("Created by " + game.get("createdByName") + " " + Y.Wegas.Helper.smartDate(game.get("createdTime")));// Set game name

            Y.Wegas.Facade.GameModel.cache.getWithView(game, "Extended", {/// Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        var gameModel = e.response.entity;
                        cb.one(".title").setHTML("" + gameModel.get("name") + " <br />" + game.get("name")); // Add title
                        cb.one(".description").setHTML(gameModel.get("description"))
                                //|| "<em><center>No description available</em></center>")
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
            var cb = this.get("contentBox"), autoCompleteCfg = {
                type: "autocomplete",
                autoComp: {
                    minQueryLength: 2,
                    maxResults: 30,
                    resultTextLocator: function(o) {
                        return o.firstname + " " + o.lastname;
                    },
                    resultHighlighter: 'phraseMatch',
                    source: Y.Wegas.app.get("base") + "rest/User/AutoCompleteFull/{query}",
                    enableCache: true
                            //resultListLocator: Y.bind(function(responses) {           // Remove users that are already in the list
                            //    var i;
                            //    Y.Array.each(this.userList.subFields, function(user) {
                            //        for (i = 0; i < responses.length; i++) {
                            //            if (user.getValue().userId === responses[i].value) {
                            //                responses.splice(responses[i], 1);
                            //                break;
                            //            }
                            //        }
                            //    });
                            //    return responses;
                            //}, this)
                }
            };

            this.otherAccounts = [];

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
                        },
                        Y.mix({
                            name: "firstname",
                            required: true,
                            typeInvite: "required",
                            size: 13
                        }, autoCompleteCfg),
                        Y.mix({
                            name: "lastname",
                            typeInvite: "required",
                            required: true,
                            size: 13
                        }, autoCompleteCfg),
                        Y.mix({
                            name: "email",
                            //type: "email",
                            typeInvite: "optional",
                            //required: true,
                            size: 13
                        }, autoCompleteCfg), {
                            name: "password",
                            type: "password",
                            //required: true,
                            //typeInvite: "password",                           // typeInvite dont work on password in inputex
                            size: 13
                        }]
                }
            });
            cb.all("input[type=\"password\"]").setAttribute("placeholder", "required");// Put placeholder attribute on all password fields
            cb.one(".inputEx-ListField").append(cb.one("img.inputEx-ListField-addButton"));// Move add button at the end of the list

            Y.on("domready", this.updateAutoCompletes, this);
            cb.one("img.inputEx-ListField-addButton").on("click", function() {
                Y.later(10, this, this.updateAutoCompletes);
            }, this);// Add proper callback on autocomplete
        },
        updateAutoCompletes: function() {
            var i, j;
            for (i = 0; i < this.playersField.subFields.length; i++) {
                for (j = 1; j < 4; j += 1) {
                    var field = this.playersField.subFields[i].inputs[j];
                    if (!field.wmodified) {
                        field.yEl.ac.after("select", function(e) {
                            this.setValue(e.result.raw);
                        }, this.playersField.subFields[i]);
                        field.wmodified = true;
                    }
                }
            }
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
