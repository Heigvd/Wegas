/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/*global define, require, window*/
define(["game",
        "ember-data",
        "ember",

        //no function param dependencies
        "controller/game",
        "controller/games",
        "controller/players",
        "controller/teams",
        "templates/games",
        "component/modal-dialog",
        "templates/players",
        "templates/teams",
        "textarea-edit"],
    function(game, DS, Ember) {
        "use strict";
        var Admin = Ember.Application.create();
        Admin.ApplicationAdapter = DS.RESTAdapter.extend({
            namespace: "." + window.config.contextPath + "/rest/Admin",
            headers: {
                'Content-Type': 'application/json'
            },
            pathForType: function(type) {
                return Ember.String.capitalize(type);
            },
            updateRecord: function(store, type, record) {
                var data = {};
                var serializer = store.serializerFor(type.typeKey);

                serializer.serializeIntoHash(data, type, record);
                var id = Ember.get(record, 'id');

                return this.ajax(this.buildURL(type.typeKey, id, record), "PUT", {data: data[type.typeKey]});
            }
        });

        Admin.Router.map(function() {
            this.resource("games", {path: "/"}, function() {

            });
        });
        Admin.Game = game;
        Admin.GamesRoute = Ember.Route.extend({
            queryParams: {"type": {refreshModel: true}},
            model: function(params) {
                return this.store.find("game", {type: params.type});
            },
            actions: {
                openModal: function(modalName, model) {
                    this.controllerFor(modalName).set("model", model);
                    return this.render(modalName, {
                        outlet: "modal",
                        into: "games",
                        controller: modalName
                    });
                },
                closeModal: function() {
                    return this.disconnectOutlet({
                        outlet: "modal",
                        parentView: "games"
                    });
                }
            }
        });
        Admin.GameRoute = Ember.Route.extend({
            model: function(params) {
                this.model.find("Game", params.id);
            }
        });
        Admin.GamesController = require("controller/games");
        Admin.GameController = require("controller/game");
        Admin.PlayersController = require("controller/players");
        Admin.TeamsController = require("controller/teams");
        Admin.GameSerializer = DS.RESTSerializer.extend({
            extractArray: function(store, type, payload) {
                var games = [];
                payload.forEach(function(game){
                    var newTeams = [],
                        newPlayers = [],
                        declaredSize = 0;
                    if (game.teams) {
                        game.teams.forEach(function (team) {
                            var newTeam;
                            try {
                                newTeam = JSON.parse(team);
                                if (newTeam.declaredSize != null) {
                                    declaredSize += newTeam.declaredSize;
                                }
                                if (newTeam.playerNames.length !== 0) {
                                    newPlayers = newPlayers.concat(newTeam.playerNames);
                                }

                            } catch (e) {
                                newTeam = {name: 'Internal JSON error', declaredSize: 0, playerNames: []};
                            }
                            newTeam.realMatchesDeclaredSize = (newTeam.playerNames.length === newTeam.declaredSize);
                            newTeam.realGreaterThanDeclaredSize = (newTeam.playerNames.length > newTeam.declaredSize);
                            newTeam.hasDeclaredSize = (newTeam.declaredSize>0);
                            newTeams.push(newTeam);
                        });
                        if (!game.teamCount)
                            game.teamCount = newTeams.length;
                        if (!game.players)
                            game.players = newPlayers;
                    }
                    game.declaredSize = declaredSize;
                    delete game.teams;
                    game.teams = newTeams;
                    games.push(game);
                });
                return games;
            }
        });

    });


