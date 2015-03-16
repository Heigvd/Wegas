angular.module('private.scenarist', [
    'private.scenarist.scenarios',
    'private.scenarist.scenarios.new'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist', {
            url: 'scenarist',
            views: {
                'workspace': {
                    controller: 'ScenaristCtrl',
                    templateUrl: 'app/private/scenarist/scenarist.tmpl.html'
                },
                'scenarios-new@wegas.private.scenarist':{
                    controller: 'ScenariosNewCtrl as scenariosNewCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios-new/scenarios-new.tmpl.html'
                },
                'scenarios-list@wegas.private.scenarist':{
                    controller: 'ScenariosListCtrl as scenariosListCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios.tmpl.html'
                }
            }
        })
    ;
})
.controller('ScenaristCtrl', function ScenaristCtrl($state, Auth) {
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            if(!user.isScenarist){
                if(user.isTrainer){
                    $state.go("wegas.private.trainer");
                }else{
                    $state.go("wegas.private.player");
                }
            }
        }
    });
});