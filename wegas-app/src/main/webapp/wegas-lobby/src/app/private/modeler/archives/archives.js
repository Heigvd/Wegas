angular
.module('private.modeler.archives', [
    'private.modeler.archives.directives'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.modeler.archives', {
            url: '/archives',
            views: {
                'modal@wegas.private': {
                    controller: 'ModelerArchivesController as archivesCtrl'
                }
            }
        });
})
.controller('ModelerArchivesController', function ModelerArchivesController($animate, $state, WegasModalService, Auth) {
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isModeler) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/modeler/archives/archives.tmpl.html',
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