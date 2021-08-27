angular.module('private.trainer.users.directives', [
    'wegas.directives.search.users'
])
    .directive('trainerSessionsUsersIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/users/directives.tmpl/index.html',
            controller: "TrainerUsersIndexCtrl as usersIndexCtrl"
        };
    })
    .controller("TrainerUsersIndexCtrl", function TrainerUsersIndexCtrl($state, $stateParams, $interval, PermissionsModel, SessionsModel, Flash) {
        "use strict";
        var ctrl = this,
            formatPlayer = function() {
                ctrl.session.players = [];
                ctrl.session.teams.forEach(function(team) {
                    team.players.forEach(function(player) {
                        ctrl.session.players.push(player);
                    });
                });
            },
            updatePermission = function() {
                PermissionsModel.getSessionPermissions(ctrl.session).then(function(trainers) {
                    ctrl.trainers = trainers;
                });
            },
            callbackCleanup = function() {
                if (ctrl.session.properties.freeForAll) {
                    formatPlayer();
                }
                updatePermission();
            },
            callbackSession = function(response) {
                if (!response.isErroneous()) {
                    ctrl.session = response.data;
                    // If necessary, fetch the full session including the teams:
                    if (ctrl.session && !ctrl.session.teams) {
                        SessionsModel.refreshSession(ctrl.kindsOfSession, ctrl.session).then(function(refreshed) {
                            if (refreshed.data) {
                                ctrl.session = refreshed.data;
                            }
                            callbackCleanup();
                        });
                    } else {
                        callbackCleanup();
                    }
                } else {
                    response.flash();
                }
            };

        ctrl.session = {};
        ctrl.trainers = [];
        ctrl.restrictRoles = ["Trainer", "Administrator", "Scenarist"];
        ctrl.playersViewActived = true;
        ctrl.refreshing = -1;
        ctrl.kindsOfSession = ($state.$current.name === "wegas.private.trainer.users") ? "LIVE" : "BIN";

        ctrl.refreshSession = function() {
            ctrl.refreshing = 1;
            SessionsModel.refreshSession(ctrl.kindsOfSession, ctrl.session).then(function(response) {
                callbackSession(response);
                var refreshingTimer = $interval(function() {
                    $interval.cancel(refreshingTimer);
                    ctrl.refreshing = 0;
                    refreshingTimer = $interval(function() {
                        $interval.cancel(refreshingTimer);
                        ctrl.refreshing = -1;
                    }, 1200);
                }, 500);
            });
        };

        ctrl.updateSession = function() {
            SessionsModel.getSession(ctrl.kindsOfSession, $stateParams.id).then(function(response) {
                // hack to force refresh
                response.data.teams = null;
                callbackSession(response);
            });
        };

        ctrl.activePlayersView = function() {
            ctrl.playersViewActived = true;
        };

        ctrl.activeTrainersView = function() {
            ctrl.playersViewActived = false;
        };

        ctrl.addTrainer = function(selection) {
            PermissionsModel.addSessionPermission(ctrl.session, ctrl.trainers, selection).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.removeTrainer = function(trainer) {
            PermissionsModel.removeSessionPermission(ctrl.session, ctrl.trainers, trainer).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.removePlayer = function(playerId, teamId) {
            SessionsModel.removePlayerToSession($stateParams.id, playerId, teamId).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.removeTeam = function(teamId) {
            SessionsModel.removeTeamToSession($stateParams.id, teamId).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.updateSession();
    })
    .directive('trainerSessionsUsersTrainersList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/users/directives.tmpl/trainers-list.html',
            restrict: 'A',
            require: "^trainerSessionsUsersIndex",
            scope: {
                trainers: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                scope.remove = function(trainer) {
                    parentCtrl.removeTrainer(trainer);
                };
            }
        };
    })
    .directive('trainerSessionsUsersIndividualList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/users/directives.tmpl/individual-list.html',
            restrict: 'A',
            require: "^trainerSessionsUsersIndex",
            scope: {
                players: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                scope.remove = function(playerId, teamId) {
                    parentCtrl.removePlayer(playerId, teamId);
                };
            }
        };
    })
    .directive('trainerSessionsUsersTeamList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/users/directives.tmpl/team-list.html',
            restrict: 'A',
            require: "^trainerSessionsUsersIndex",
            scope: {
                teams: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                scope.remove = function(teamId) {
                    parentCtrl.removeTeam(teamId);
                };
            }
        };
    });
