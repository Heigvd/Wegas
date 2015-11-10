angular
.module('private.scenarist.coscenarists', [
    'private.scenarist.coscenarists.directives'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.scenarist.coscenarists', {
            url: '/:scenarioId/coscenarists',
            views: {
                'modal@wegas.private': {
                    controller: 'CoscenaristsCtrl'
                }
            }
        });
})
.controller('CoscenaristsCtrl', function CoscenaristsCtrl($state, WegasModalService, Auth) {
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isScenarist) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/scenarist/coscenarists/coscenarists.tmpl.html',
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