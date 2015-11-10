angular.module('private.trainer.archives', [
    'private.trainer.archives.directives',
    'private.trainer.settings'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.trainer.archives', {
                url: '/archives',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerArchivesController'
                    }
                }
            })
            .state('wegas.private.trainer.archives.settings', {
                url: '/:id/settings',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerSettingsController'
                    }
                }
            })
            .state('wegas.private.trainer.archives.users', {
                url: '/:id/users',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerUsersController'
                    }
                }
            });
    }).controller("TrainerArchivesController", function TrainerArchivesController($state, WegasModalService) {
        "use strict";
        WegasModalService.displayAModal({
            templateUrl: 'app/private/trainer/archives/archives.tmpl.html',
            controller: "ModalsController as modalsCtrl"
        }).then(function(modal) {
            modal.close.then(function(result) {
                $state.go("^");
            });
        });
    });