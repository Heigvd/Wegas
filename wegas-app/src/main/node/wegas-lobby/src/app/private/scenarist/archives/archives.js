angular
.module('private.scenarist.archives', [
    'private.scenarist.archives.directives'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.scenarist.archives', {
            url: '/archives',
            views: {
                'modal@wegas.private': {
                    controller: 'ScenaristArchivesController as archivesCtrl'
                }
            }
        });
})
.controller('ScenaristArchivesController', function ScenaristArchivesController($animate, $state, WegasModalService, Auth) {
    "use strict";
    Auth.getAuthenticatedUser().then(function(user) {
        if (user) {
            if (user.isAdmin || user.isScenarist) {
                WegasModalService.displayAModal({
                    templateUrl: 'app/private/scenarist/archives/archives.tmpl.html',
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