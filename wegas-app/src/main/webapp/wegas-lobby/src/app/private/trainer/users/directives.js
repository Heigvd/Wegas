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
    }).controller("TrainerUsersIndexCtrl", function TrainerUsersIndexCtrl($stateParams, SessionsModel, Flash) {
        var ctrl = this;
        ctrl.session = {},
        ctrl.restrictRoles = ["Trainer", "Administrator", "Scenarist"];

        ctrl.playersViewActived = true;

        ctrl.refreshSession = function () {
            SessionsModel.refreshSession("managed", ctrl.session).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.session = response.data;
                } else {
                    response.flash();
                }
            });
        };
        ctrl.updateSession = function() {
            SessionsModel.getSession("managed", $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                }
            });
        };
        ctrl.updateSession();
        ctrl.activePlayersView = function() {
            ctrl.playersViewActived = true;
        };

        ctrl.activeTrainersView = function() {
            ctrl.playersViewActived = false;
        };

        ctrl.addTrainer = function(selection) {
            SessionsModel.addTrainerToSession($stateParams.id, selection).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }else{
                    response.flash();
                }
            });
        }
        ctrl.removeTrainer = function(trainerId) {
            SessionsModel.removeTrainerToSession($stateParams.id, trainerId).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }else{
                    response.flash();
                }
            });
        }
        ctrl.removePlayer = function(playerId, teamId) {
            SessionsModel.removePlayerToSession($stateParams.id, playerId, teamId).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }else{
                    response.flash();
                }
            });
        }

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