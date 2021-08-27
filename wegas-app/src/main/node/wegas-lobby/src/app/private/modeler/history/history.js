angular
.module('private.modeler.history', ['private.modeler.history.directives'])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
    .state('wegas.private.modeler.history', {
        url: '/:modelId/history',
        views: {
            'modal@wegas.private': {
                controller: 'ModelerHistoryController',
            }
        }
    });
})
.controller("ModelerHistoryController", function ModelerHistoryController($state, $translate, WegasModalService, Auth){
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isModeler) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/modeler/history/history.tmpl.html',
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
