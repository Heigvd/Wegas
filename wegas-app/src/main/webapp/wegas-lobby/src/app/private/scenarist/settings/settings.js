angular.module('private.scenarist.settings', [
    'private.scenarist.settings.directives'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.scenarist.settings', {
                url: '/:scenarioId/settings',
                views: {
                    'modal@wegas.private': {
                        controller: 'ScenaristSettingsController'
                    }
                }
            });
    }).controller("ScenaristSettingsController", function ScenaristSettingsController($state, WegasModalService, Auth) {
        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (user.isAdmin || user.isScenarist) {
                    WegasModalService.displayAModal({
                        templateUrl: 'app/private/scenarist/settings/settings.tmpl.html',
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