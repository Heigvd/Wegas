angular.module('private.trainer.sessions.users.directives', [
    'wegas.directives.search.users'
])
    .directive('trainerSessionsUsersIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/sessions/users/directives.tmpl/index.html',
            controller: "TrainerSessionsUsersIndexCtrl as usersIndexCtrl"
        };
    }).controller("TrainerSessionsUsersIndexCtrl", function TrainerSessionsUsersIndexCtrl($stateParams, SessionsModel, Flash) {
        var ctrl = this;
        ctrl.session = {},
        ctrl.restrictRoles = ["Trainer", "Administrator", "Scenarist"];

        ctrl.playersViewActived = true;
        SessionsModel.getSession("managed", $stateParams.id, true).then(function(response) {
            ctrl.session = response.data || {};
            if (response.isErroneous()) {
                response.flash();
            }
        });

        ctrl.updateSession = function() {
            SessionsModel.getSession("managed", $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};
                if (response.isErroneous()) {
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
            SessionsModel.addTrainerToSession($stateParams.id, selection).then(function(response) {
                response.flash();
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }
            });
        }
        ctrl.removeTrainer = function(trainerId) {
            SessionsModel.removeTrainerToSession($stateParams.id, trainerId).then(function(response) {
                response.flash();
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }
            });
        }
        ctrl.removePlayer = function(playerId, teamId) {
            SessionsModel.removePlayerToSession($stateParams.id, playerId, teamId).then(function(response) {
                response.flash();
                if (!response.isErroneous()) {
                    ctrl.updateSession();
                }
            });
        }

    })
    .directive('trainerSessionsUsersTrainersList', function() {
        return {
            templateUrl: 'app/private/trainer/sessions/users/directives.tmpl/trainers-list.html',
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
            templateUrl: 'app/private/trainer/sessions/users/directives.tmpl/individual-list.html',
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
            templateUrl: 'app/private/trainer/sessions/users/directives.tmpl/team-list.html',
            restrict: 'A',
            require: "^trainerSessionsUsersIndex",
            scope: {
                teams: '='
            }
        }
    });