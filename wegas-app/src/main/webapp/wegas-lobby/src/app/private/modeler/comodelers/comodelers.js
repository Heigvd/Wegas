angular
.module('private.modeler.comodelers', [
    'private.modeler.comodelers.directives'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.modeler.comodelers', {
            url: '/:modelId/comodelers',
            views: {
                'modal@wegas.private': {
                    controller: 'ComodelersCtrl'
                }
            }
        });
})
.controller('ComodelersCtrl', function ComodelersCtrl($state, WegasModalService, Auth) {
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isModeler) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/modeler/comodelers/comodelers.tmpl.html',
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