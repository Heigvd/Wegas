angular.module('private.scenarist.customize', [
    'private.scenarist.customize.directives'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.scenarist.customize', {
                url: '/:scenarioId/customize',
                views: {
                    'modal@wegas.private': {
                        controller: 'ScenaristCustomizeController'
                    }
                }
            });
    }).controller("ScenaristCustomizeController", function ScenaristCustomizeController($animate, $state, ModalService, Auth) {
        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (user.isAdmin || user.isScenarist) {
                    ModalService.showModal({
                        templateUrl: 'app/private/scenarist/customize/customize.tmpl.html',
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