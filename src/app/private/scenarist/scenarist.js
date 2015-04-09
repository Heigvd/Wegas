angular.module('private.scenarist', [
    'private.scenarist.scenarios',
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
                templateUrl: 'app/private/scenarist/scenarios/scenarios.tmpl.html'
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
            if(!user.isScenarist) {
                if(user.isTrainer) {
                    $state.go("wegas.private.trainer");
                } else {
                    $state.go("wegas.private.player");
                }
            }
        }



    });
});