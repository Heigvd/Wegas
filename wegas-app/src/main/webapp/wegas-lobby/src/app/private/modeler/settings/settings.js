angular.module('private.modeler.settings', [
    'private.modeler.settings.directives'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.modeler.settings', {
                url: '/:modelId/settings',
                views: {
                    'modal@wegas.private': {
                        controller: 'ModelerSettingsController'
                    }
                }
            });
    }).controller("ModelerSettingsController", function ModelerSettingsController($state, WegasModalService, Auth) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (user.isAdmin || user.isModeler) {
                    WegasModalService.displayAModal({
                        templateUrl: 'app/private/modeler/settings/settings.tmpl.html',
                        controller: "ModalsController as modalsCtrl"
                    }).then(function(modal) {
                        modal.close.then(function(result) {
                            $state.go("^");
                        });
                    });
                }
            }
        });
    });
