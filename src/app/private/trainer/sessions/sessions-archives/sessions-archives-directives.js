angular.module('private.trainer.sessions.archives.directives', [])
    .directive('trainerSessionsArchivesIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/sessions/sessions-archives/sessions-archives-directives.tmpl/sessions-archives-index.tmpl.html',
            controller: "TrainerSessionsArchivesController as trainerSessionsArchivesCtrl"
        };
    }).controller("TrainerSessionsArchivesController", function TrainerSessionsArchivesController(SessionsModel, Flash) {
        var ctrl = this;
        ctrl.archives = [];
        SessionsModel.getSessions("archived").then(function(response) {
            ctrl.archives = response.data || {};
            if (response.isErroneous()) {
                response.flash();
            }
        });

        ctrl.updateSession = function() {
            SessionsModel.getSessions("archived").then(function(response) {
                ctrl.archives = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                }
            });
        };
    });