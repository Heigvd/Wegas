angular.module('private.scenarist', [
    'private.scenarist.directives',
    'private.scenarist.archives',
    'private.scenarist.settings',
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
.controller('ScenaristCtrl', function ScenaristCtrl($rootScope, $state, Auth, $translate, WegasTranslations) {
    var scenaristCtrl = this;
    Auth.getAuthenticatedUser().then(function(user) {
        if(user != null) {
            if(!user.isScenarist && !user.isAdmin) {
                if(user.isTrainer) {
                    $state.go("wegas.private.trainer");
                } else {
                    $state.go("wegas.private.player");
                }
            }
            $rootScope.translationWorkspace = {workspace: WegasTranslations.workspaces['SCENARIST'][$translate.use()]};
        }
    });
});