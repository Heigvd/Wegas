angular
.module('private.modeler.instances', ['private.modeler.instances.directives'])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
    .state('wegas.private.modeler.instances', {
        url: '/:modelId/instances',
        views: {
            'modal@wegas.private': {
                controller: 'ModelerInstancesController',
            }
        }
    });
})
.controller("ModelerInstancesController", function ModelerInstancesController($state, $translate, WegasModalService, Auth){
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isModeler) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/modeler/instances/instances.tmpl.html',
                    controller: "ModalsController as modalsCtrl"
                }).then(function(modal) {
                    modal.close.then(function(result) {
                        //$state.go("^");
                        // force returning to modeler scope
                        $state.go("wegas.private.modeler");
                    });
                });
            }
        }
    });
});
