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
    }).controller("ScenaristSettingsController", function ScenaristSettingsController($animate, $state, ModalService, Auth) {
        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (user.isAdmin || user.isScenarist) {
                    ModalService.showModal({
                        templateUrl: 'app/private/scenarist/settings/settings.tmpl.html',
                        controller: "ModalsController as modalsCtrl"
                    }).then(function(modal) {
                        var box = $(".modal"),
                            shadow = $(".shadow");
                        $animate.addClass(box, "modal--open");
                        $animate.addClass(shadow, "shadow--show");

                        modal.close.then(function(result) {
                            $state.go("^");
                        });
                    });
                }
            }
        });
    });