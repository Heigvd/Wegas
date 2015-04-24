angular.module('private.scenarist', [
    'private.scenarist.directives',
    'private.scenarist.archives',
    'private.scenarist.customize',
    'private.scenarist.coscenarists',
    'private.scenarist.history'
    ])
.config(function ($stateProvider) {
    $stateProvider
    .state('wegas.private.scenarist', {
        url: 'scenarist',
        views: {
            'workspace': {
                controller: 'ScenaristCtrl as scenaristCtrl',
                templateUrl: 'app/private/scenarist/scenarist.tmpl.html'
            }
        }
    })
    ;
})
.controller('ScenaristCtrl', function ScenaristCtrl($state, Auth, ViewInfos) {
    var scenaristCtrl = this;
    Auth.getAuthenticatedUser().then(function(user) {
        if(user != null) {
            ViewInfos.editName("Scenarist workspace");
            if(!user.isScenarist && !user.isAdmin) {
                if(user.isTrainer) {
                    $state.go("wegas.private.trainer");
                } else {
                    $state.go("wegas.private.player");
                }
            }
        }
    });
});