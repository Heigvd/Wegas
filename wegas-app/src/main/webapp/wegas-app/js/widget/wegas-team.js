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
YUI.add('wegas-team', function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Wegas = Y.Wegas, Team;

    /**
     * @name Y.Wegas.Team
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class parent class for join, create a team or add member
     * @constructor
     * @description Parent class
     */

    Team = Y.Base.create("wegas-team", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
        /** @lends Y.Wegas.JoinTeam# */

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

            this.saveButton = new Y.Button({//                                  // Render the button
                label: "Join game",
                render: cb,
                visible: false
            });

            Wegas.Facade.Game.cache.getWithView(game, "Extended", {//         // Get the game model full description
                on: {
                    success: Y.bind(this.onGameRetrieved, this)
                }
            });
        },
        bindUI: function() {
            this.saveButton.on("click", this.onSaveButtonClick, this);                // On join button click
        },
        destructor: function() {
            this.saveButton.destroy();
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
            } else if (entity instanceof Wegas.persistence.Team) {
                return Wegas.Facade.Game.cache.findById(entity.get("gameId"));
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
            Wegas.Facade.Game.sendRequest({
                request: "/JoinTeam/" + teamId,
                cfg: {
                    updateCache: false
                },
                on: {
                    success: Y.bind(function() {
//                        this.showMessage("success", "Game joined");

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
        sendMultiJoinTeamRequest: function(teamId, playerToAdd) {
            if (!playerToAdd) {
                playerToAdd = this.teamEdition.getAccounts();
            }
            Wegas.Facade.Game.sendRequest({//                                 // Add all player to the list in the list to the target game
                request: "/JoinTeam/" + teamId,
                cfg: {
                    method: "POST",
                    data: playerToAdd
                },
                on: {
                    success: Y.bind(this.onSaved, this),
                    failure: Y.bind(function(e) {
                        this.teamId = teamId;                                   // @hack
                        this.defaultFailureHandler(e);
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
    Wegas.Team = Team;

    var JoinTeam = Y.Base.create("wegas-jointeam", Wegas.Team, [Y.WidgetChild, Wegas.Widget], {
        CONTENT_TEMPLATE: "<div><div class=\"wegas-gameinformation\"></div>"
            + "<div class=\"teamselection\"></div>"
            + "</div>",
        destructor: function() {
            EditTeam.superclass.destructor.apply(this);
            if (this.teamField) {
                this.teamField.destroy();
                //this.playersField.destroy();
            }
        },
        onGameRetrieved: function(e) {
            var emptyChoices, choices,
                cb = this.get(CONTENTBOX),
                teamSelectionNode = cb.one(".teamselection"),
                entity = this.getTargetEntity(),
                game = this.getTargetGame(),
                teams = game.get("teams"),
                gameModel = e.response.entity.get("gameModel"),
                teamName = (entity instanceof Wegas.persistence.Team) ? entity.get("name")
                : game.get("name") + "-" + (game.get("teams").length);

            cb.one(".wegas-gameinformation").append(Wegas.GameInformation.renderGameInformation(e.response.entities[0]));

            var showTeamSelection = false,
                showTeamCreation = false,
                showTeamEdition = false;                                    // Default case, free for all games

            if (entity instanceof Wegas.persistence.Team) {                   // If target entity is a team
                if (gameModel.get("properties.freeForAll")) {                   // If game is free for all (no team)
                    this.sendJoinTeamRequest(entity.get("id"));                 // join it directly
                } else if (entity.get("players").length === 0) {                // and this team is empty, (first connectin to this team)
                    showTeamEdition = true;                                     // display team composition edition
                } else {
                    this.showMessageBis("error",
                        "This team has already been created. You can contact it's members so they can join you in.");
                }
            } else if (entity instanceof Wegas.persistence.Game && // If target entity is a game
                !(gameModel && gameModel.get("properties.freeForAll"))) {   // and its game is not free for all (uses teams)
                showTeamCreation = true;
            }
            if (showTeamCreation || showTeamEdition) {
                teamSelectionNode.append("<br /><div class=\"title\">Create your team</div>");
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

                //teamSelectionNode.append("<div style=\"margin:10px 0\"><span style=\"color: #505050;font-style: italic;padding-left: 20px;\">Team name:</span>&nbsp;&nbsp;&nbsp;" + teamName + "</div>");

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
                this.teamEdition = new Wegas.TeamFormList({
                    render: teamSelectionNode,
                    entity: entity
                });
                this.teamEdition.addExistingAccount(
                    Wegas.Facade.User.get("currentUser").getMainAccount());// Push  current user to the team's player list
            }

            this.saveButton.set("visible", true);
        },
        onSaveButtonClick: function() {
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
                if (this.teamId) {
                    this.sendMultiJoinTeamRequest(this.teamId);
                } else {
                    Wegas.Facade.Game.sendRequest({//                             // create the team
                        //request: "/" + entity.get("id") + "/CreateTeam/" + name,
                        request: "/" + entity.get("id") + "/CreateTeam",
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
                }
            } else if (this.showTeamEdition) {                                  // If joining
                if (name !== entity.get("name")) {                              // If team name was edited,
                    entity.set("name", name);
                    Wegas.Facade.Game.sendRequest({//                         // update it
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
        /**
         * @function
         * @private
         * @description All events are added to the buttons
         * Create team button call rest url : rest/GameModel/{gameModelID}/Game/{gameID}/CreateTeam/{teamName}
         */
        onSaved: function(e) {
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
            Wegas.Facade.Game.sendRequest({
                request: "/JoinGame/" + token,
                cfg: {
                    updateCache: !this.get("customEvent")
                },
                on: {
                    success: Y.bind(function(e) {
                        if (e.response.entity instanceof Wegas.persistence.Team) { // If the returned value is a Team enity
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
    });
    Wegas.JoinTeam = JoinTeam;

    var EditTeam = Y.Base.create("wegas-editteam", Wegas.Team, [Y.WidgetChild, Wegas.Widget], {
        CONTENT_TEMPLATE: "<div>"
            + "<div class=\"teamselection\"></div>"
            + "</div>",
        renderUI: function() {
            EditTeam.superclass.renderUI.apply(this);
            this.saveButton.set("visible", true);
            this.saveButton.set("label", "Save");
        },
        onGameRetrieved: function(e) {
            var cb = this.get(CONTENTBOX),
                entity = this.getTargetEntity(),
                teamId = this.get("teamId"),
                teamSelectionNode = cb.one(".teamselection");

//            if (e) cb.one(".wegas-gameinformation").append(Wegas.GameInformation.renderGameInformation(e.response.entities[0]));
            teamSelectionNode.append("<br /><div class=\"title\">Edit your team</div>");

            this.teamEdition = new Wegas.TeamFormList({
                render: teamSelectionNode,
                entity: entity
            });

            Wegas.Facade.User.sendRequest({
                request: "/Account/FindByTeamId/" + teamId,
                on: {
                    success: Y.bind(function(e) {
                        this.joinedAccounts = [];
                        Y.Array.each(e.response.entities, function(entity) {
                            this.teamEdition.addExistingAccount(entity);
                            this.joinedAccounts.push(entity);
                        }, this);

                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        onSaveButtonClick: function() {
            var teamId = this.get("teamId"), i, playerToAdd = [], found;
            Y.Array.each(this.teamEdition.getAccounts(), function(account) {
                found = false;
                for (i = 0; i < this.joinedAccounts.length; i += 1) {
                    if (account.email === this.joinedAccounts[i].get("email")) {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    playerToAdd.push(account);
            }, this);
            this.showOverlay();
            this.sendMultiJoinTeamRequest(teamId, playerToAdd);
        },
        onSaved: function() {
            this.get(CONTENTBOX).one(".teamselection").get('childNodes').remove();
            this.onGameRetrieved();
            this.hideOverlay();
            this.showMessage("success", "Players added to the team");
        }
    }, {
        ATTRS: {
            entity: {
                value: Wegas.Facade.Game.cache.getCurrentGame()
            },
            teamId: {
                value: Wegas.Facade.Game.get("currentTeamId")
            }
        }
    });
    Wegas.EditTeam = EditTeam;

    var GameDescription = Y.Base.create("wegas-gamedescription", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
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
                game = (entity instanceof Wegas.persistence.Team) ? Wegas.Facade.Game.cache.findById(entity.get("gameId"))
                : entity;

            cb.one(".subtitle").setHTML("Created by " + game.get("createdByName") + " " + Wegas.Helper.smartDate(game.get("createdTime")));// Set game name

            Wegas.Facade.Game.cache.getWithView(game, "Extended", {/// Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        var game = e.response.entity;
                        cb.one(".title").setHTML("" + game.get("gameModelName") + " <br />" + game.get("name")); // Add title
                        cb.one(".description").setHTML(game.get("description"))
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
    Wegas.GameDescription = GameDescription;

    var TeamFormList = Y.Base.create("wegas-teamformlist", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class=\"header yui3-g\">"
            + "<div class=\"yui3-u\">First name</div>"
            + "<div class=\"yui3-u\">Last name</div>"
            + "<div class=\"yui3-u\">Email</div>"
            + "<div class=\"yui3-u\">Password</div></div>"

            + "<div class=\"uneditable-players\"></div></div>",
        renderUI: function() {
            var cb = this.get("contentBox"), gameId = Y.Widget.getByNode(this._parentNode).getTargetGame().get("id"),
                resultTemplate = "{highlighted} <p class='email'>{email}</p>",
                autoCompleteCfg = {
                    type: "autocomplete",
                    autoComp: {
                        minQueryLength: 2,
                        maxResults: 30,
                        resultFormatter: function(query, results) {
                            return Y.Array.map(results, function(result) {
                                return Y.Lang.sub(resultTemplate, {
                                    email: result.raw.email,
                                    highlighted: result.highlighted
                                });
                            });
                        },
                        resultHighlighter: function(query, results) {
                            return Y.Array.map(results, function(result) {
                                return Y.Highlight.all(result.raw.firstname + " " + result.raw.lastname, query);
                            });
                        },
                        source: Wegas.app.get("base") + "rest/User/AutoCompleteFull/{query}/" + gameId,
                        enableCache: true,
                        resultListLocator: Y.bind(function(responses) {
                            var i;
                            Y.Array.each(this.otherAccounts, function(account) {
                                for (i = 0; i < responses.length; i += 1) {
                                    if (account.id === responses[i].id) {
                                        responses.splice(i, 1);
                                        break;
                                    }
                                }
                            });
                            Y.Array.each(this.playersField.subFields, function(user) {
                                for (i = 0; i < responses.length; i += 1) {
                                    if (user.getValue().email === responses[i].email) {
                                        responses.splice(i, 1);
                                        break;
                                    }
                                }
                            });
                            return responses;
                        }, this),
                        align: {
                            node: '.inputEx-AutoComplete',
                            points: ['tl', 'bl']
                        }
                    }
                };

            this.otherAccounts = [];

            this.playersField = new Y.inputEx.ListField({//                     // Render team edition
                parentEl: cb,
                elementType: {
                    type: "group",
                    fields: [{
                            name: "@class",
                            type: "hidden",
                            value: "JpaAccount"
                        },
                        {
                            name: "id",
                            type: "hidden"
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
//            cb.one(".inputEx-ListField").append(cb.one("img.inputEx-ListField-addButton"));// Move add button at the end of the list
            cb.one(".inputEx-ListField").append('<div class="addTeamMember" style="cursor: pointer;"><span class=\"wegas-icon wegas-icon-add\"></span>Add member</div>');
            cb.one(".inputEx-ListField .addTeamMember").on("click", function() {
                this.playersField.addElement();
                Y.later(10, this, this.updateAutoCompletes);
            }, this);

            Y.on("domready", this.updateAutoCompletes, this);
//            cb.one("img.inputEx-ListField-addButton").on("click", function() {
//                Y.later(10, this, this.updateAutoCompletes);
//            }, this);// Add proper callback on autocomplete
        },
        updateAutoCompletes: function() {
            var i, j, fields;
            for (i = 0; i < this.playersField.subFields.length; i++) {
                for (j = 2; j < 5; j += 1) {
                    var field = this.playersField.subFields[i].inputs[j];
                    if (!field.wmodified) {
                        field.yEl.ac.after("select", function(e) {
                            this.setValue(e.result.raw);
                            this.disable(true);
                        }, this.playersField.subFields[i]);
                        field.wmodified = true;
                    }
                    field.on("updated", function(e, aut, subfields) {
                        fields = new Y.Node(subfields.getEl());
                        if (subfields.inputs[1].getValue() === "") {
                            if (!fields.one(".wegas-newAccount"))
                                fields.append("<p class='wegas-newAccount'>Your are creating a new account</p>");
                        } else {
                            if (fields.one(".wegas-newAccount"))
                                fields.one(".wegas-newAccount").remove();
                        }
                    }, this, this.playersField.subFields[i]);
                }
            }
        },
        addExistingAccount: function(account) {
            var cb = this.get("contentBox"),
                firstname = (account instanceof Wegas.persistence.GuestJpaAccount) ? account.getPublicName() :
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
    Wegas.TeamFormList = TeamFormList;

    Y.inputEx.AutoComplete.prototype.buildAutocomplete = function() {
        // Call this function only when this.el AND this.listEl are available
        if (!this._nElementsReady) {
            this._nElementsReady = 0;
        }
        this._nElementsReady++;
        if (this._nElementsReady != 2)
            return;

        this.yEl = Y.one(this.el)
        this.yEl.plug(Y.Plugin.AutoComplete, this.options.autoComp);

        // Instantiate AutoComplete
        this.yEl.ac.on("select", this.itemSelectHandler, this);
        this.yEl.on("blur", this.onBlur, this);

        this.yEl.on("valueChange", function() {                                 // @MODIFIED
            this.hiddenEl.value = this.el.value;
            this.validate();
        }, this);
    };
});
