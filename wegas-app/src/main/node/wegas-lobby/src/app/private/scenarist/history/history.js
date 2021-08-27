angular
.module('private.scenarist.history', ['private.scenarist.history.directives'])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
    .state('wegas.private.scenarist.history', {
        url: '/:scenarioId/history',
        views: {
            'modal@wegas.private': {
                controller: 'ScenaristHistoryController',
            }
        }
    });
})
.controller("ScenaristHistoryController", function ScenaristHistoryController($state, $translate, WegasModalService, Auth){
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isScenarist) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/scenarist/history/history.tmpl.html',
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