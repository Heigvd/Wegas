angular.module('private.trainer.sessions.customize.directives', [
])
    .directive('trainerSessionsCustomizeIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/sessions/session-customize/session-customize-directives.tmpl/session-users-index.tmpl.html',
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

    });