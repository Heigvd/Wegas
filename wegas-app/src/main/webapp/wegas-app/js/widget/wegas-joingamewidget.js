/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-joingamewidget', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    JoinGameWidget;

    /**
     *
     *  @class Y.Wegas.JoinGameWidget
     */
    JoinGameWidget = Y.Base.create("wegas-joingamewidget", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        // *** Private fields *** //

        // *** Lifecycle Methods *** //
        renderUI: function () {
            var cb = this.get(CONTENTBOX);

            this.tokenField = new Y.inputEx.StringField({                       // Render
                required: false,
                parentEl: cb,
                label: "Enter a key phrase to join a game",
                typeInvite: "Enter a token"
            });

            cb.append('<div class="lobbyOr"><p>Or</p><div>');

            this.selectPublicGame = new Y.inputEx.SelectField({                 // Render public games
                required: false,
                parentEl: cb,
                label: "Select a public game"
            });

            this.joinGameButton = new Y.Button({
                label: "Join game"
            });
            this.joinGameButton.render(cb);

            this.teamsField = new Y.inputEx.SelectField({                       // Render team selection
                required: "true",
                parentEl: cb,
                label: "Select a new you want to join"
            });
            this.teamsField.hide();
            this.joinTeamButton = new Y.Button({
                label: "Join team",
                visible: false
            });
            this.joinTeamButton.render(cb);

            this.createTeamField = new Y.inputEx.StringField({                  // Render team creation
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

        bindUI: function () {

            this.tokenField.on("updated", function (e) {
                if (this.tokenField.getValue() !== "") {
                    this.selectPublicGame.setValue("");
                }
            }, this);

            this.selectPublicGame.on("updated", function (e) {
                if (this.selectPublicGame.getValue() !== "") {
                    this.tokenField.setValue("");
                }
            }, this);

            this.joinGameButton.on("click", function (e) {                      // join a game based on a token
                var gameToJoin;
                if (this.tokenField.getValue() !== "") {
                    gameToJoin = this.tokenField.getValue();
                } else if (this.selectPublicGame.getValue() !== "") {
                    gameToJoin = this.selectPublicGame.getValue();
                } else {
                    this.showMessage("error", "A key phrase or a public Game must be selected");
                    return;
                }
                Y.Wegas.GameFacade.rest.sendRequest({
                    request: "/JoinGame/" + gameToJoin,
                    on: {
                        success: Y.bind(function (e) {
                            if (e.response.entity                           // If the returned value is a Team enity
                                instanceof Y.Wegas.persistence.Team) {
                                this.sendJoinTeamRequest(                   // it means we can join this team directly
                                    e.response.entity.get("id"));
                            } else {
                                this.showTeams();                           // otherwise the player can choose or create its team
                            }
                        }, this),
                        failure: Y.bind(function (e) {
                            this.showMessage("error", e.response.results.message || "Invalid token", 4000);
                        }, this)
                    }
                });
            }, this);

            this.joinTeamButton.on("click", function (e) {                      // Join an existing team
                if (this.teamsField.validate()) {
                    this.sendJoinTeamRequest(this.teamsField.getValue());
                }
            }, this);
            this.createButton.on("click", function (e) {                      // Create a new team
                if (this.createTeamField.validate()) {
                    var team = new Y.Wegas.persistence.Team({
                        name: this.createTeamField.getValue()
                    });
                    Y.Wegas.GameFacade.rest.post(team.toObject(), this.currentGame.toObject(), {
                        success: Y.bind(function (e) {
                            this.sendJoinTeamRequest(e.response.entity.get("id"));
                        }, this),
                        failure: Y.bind(function (e) {
                            this.showMessage("error", e.response.results.message || "Error creating team", 4000);
                        }, this)
                    });
                }
            }, this);
        },

        showTeams: function () {
            //this.msg.empty();

            this.joinGameButton.hide();
            this.tokenField.hide();
            this.selectPublicGame.hide();
            this.p.hide();
            this.joinTeamButton.show();
            this.teamsField.show();
            this.createButton.show();
            this.createTeamField.show();

            this.currentGame = Y.Wegas.GameFacade.rest.getCache()[0];

            var i, teams = this.currentGame.get("teams");

            for (i = 0; i < teams.length; i = i + 1) {
                this.teamsField.addChoice({
                    label: teams[i].get("name"),
                    value: teams[i].get("id")
                });
            }
        },

        showPublicGames: function () {
            this.selectPublicGame.addChoice({
                label: "--Select--",
                value: ""
            });

            Y.Wegas.PublicGamesFacade.rest.sendRequest({
                request: "/Games/",
                on: {
                    success: Y.bind(function (e) {
                        var data = e.response.results.entities;
                        Y.Array.forEach(data, function (game) {
                            this.selectPublicGame.addChoice({
                                label: game.toObject().name,
                                value: game.toObject().token
                            });
                        }, this);
                    }, this),
                    failure: Y.bind(function (e) {
                        this.showMessage("error", "Error");
                    }, this)
                }
            });
        },

        sendJoinTeamRequest: function (teamId) {
            Y.Wegas.GameFacade.rest.sendRequest({
                request: "/JoinTeam/" + teamId,
                on: {
                    success: Y.bind(function (e) {

                        this.showMessage("success", "Game joined, it has been added to your games", 10000);

                        Y.Wegas.RegisteredGamesFacade.rest.clearCache();
                        Y.Wegas.RegisteredGamesFacade.sendInitialRequest();

                        this.createButton.hide();
                        this.createTeamField.hide();
                        this.joinTeamButton.hide();
                        this.teamsField.hide();
                        this.joinGameButton.hide();
                        this.tokenField.hide();
                    }, this),
                    failure: Y.bind(function (e) {
                        this.showMessage("error", "Error joining team");
                    }, this)
                }
            });
        }
    });

    Y.namespace('Wegas').JoinGameWidget = JoinGameWidget;
});
