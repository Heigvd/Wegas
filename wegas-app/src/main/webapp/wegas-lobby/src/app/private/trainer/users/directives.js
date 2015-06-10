angular.module('private.trainer.users.directives', [
    'wegas.directives.search.users'
])
    .directive('trainerSessionsUsersIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/users/directives.tmpl/index.html',
            controller: "TrainerUsersIndexCtrl as usersIndexCtrl"
        };
    }).controller("TrainerUsersIndexCtrl", function TrainerUsersIndexCtrl($state, $stateParams, PermissionsModel, SessionsModel, Flash) {
        var ctrl = this,
            formatPlayer = function(){
                ctrl.session.players = [];
                ctrl.session.teams.forEach(function(team){
                    team.players.forEach(function(player){
                        ctrl.session.players.push(player);
                    });
                });
            },
            updatePermission = function(){
                PermissionsModel.getSessionPermissions(ctrl.session).then(function(trainers){
                    ctrl.trainers = trainers;
                });
            };

        ctrl.session = {};
        ctrl.trainers = [];
        ctrl.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
        ctrl.restrictRoles = ["Trainer", "Administrator", "Scenarist"];
        ctrl.playersViewActived = true;
        ctrl.kindsOfSession = ($state.$current.name == "wegas.private.trainer.users") ? "LIVE" : "BIN";

        ctrl.refreshSession = function () {
            SessionsModel.refreshSession(ctrl.kindsOfSession, ctrl.session).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.session = response.data;
                    if(ctrl.session.properties.freeForAll){
                        formatPlayer();
                    }
                    updatePermission();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.updateSession = function() {
            SessionsModel.getSession(ctrl.kindsOfSession, $stateParams.id).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.session = response.data || {};
                    if(ctrl.session.properties.freeForAll){
                        formatPlayer();
                    }
                    updatePermission();
                }else{
                    response.flash();
                }
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
                }else{
                    response.flash();
                }
            });
        };

        ctrl.removeTrainer = function(trainer) {
            PermissionsModel.removeSessionPermission(ctrl.session, ctrl.trainers, trainer).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }else{
                    response.flash();
                }
            });
        };

        ctrl.removePlayer = function(playerId, teamId) {
            SessionsModel.removePlayerToSession($stateParams.id, playerId, teamId).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }else{
                    response.flash();
                }
            });
        };

        ctrl.updateSession();
    })
    .directive('trainerSessionsUsersTrainersList', function() {
        return {
            templateUrl: 'app/private/trainer/users/directives.tmpl/trainers-list.html',
            restrict: 'A',
            require: "^trainerSessionsUsersIndex",
            scope: {
                trainers: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                scope.remove = function(trainerId) {
                    parentCtrl.removeTrainer(trainerId);
                }
            }
        }
    })
    .directive('trainerSessionsUsersIndividualList', function() {
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
                }
            }
        }
    })
    .directive('trainerSessionsUsersTeamList', function() {
        return {
            templateUrl: 'app/private/trainer/users/directives.tmpl/team-list.html',
            restrict: 'A',
            require: "^trainerSessionsUsersIndex",
            scope: {
                teams: '='
            }
        }
    });