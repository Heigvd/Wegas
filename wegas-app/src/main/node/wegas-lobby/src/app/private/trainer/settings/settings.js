angular.module('private.trainer.settings', [
    'wegas.behaviours.text',
    'private.trainer.settings.directives'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.trainer.settings', {
                url: '/:id/settings',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerSettingsController'
                    }
                }
            });
    })
    .controller("TrainerSettingsController", function TrainerSettingsController($state, WegasModalService, Auth) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (user.isAdmin || user.isScenarist || user.isTrainer) {
                    WegasModalService.displayAModal({
                        templateUrl: 'app/private/trainer/settings/settings.tmpl.html',
                        controller: "ModalsController as modalsCtrl"
                    }).then(function(modal) {
                        modal.close.then(function() {
                            $state.go("^");
                        });
                    });
                }
            }
        });
    });
